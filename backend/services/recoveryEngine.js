// Recovery Engine: Recovery Simulator + Autonomous Recovery Agent.
//
// Every other engine in this app answers "what leaked and why". This one
// answers "what happens if we try to get it back". For each open leak
// (loud ones from revenueRisk.js, hidden ones from leakageDetector.js) the
// simulator projects:
//   - a success probability for the type of recovery action involved
//     (chasing an overdue payment behaves very differently than trying to
//     claw back a discount that's already been invoiced and accepted)
//   - a recoverable upside, and an expected value (upside * probability)
//   - the concrete step sequence a human/agent would work through
//
// The Autonomous Recovery Agent always simulates first, never acts blind.
// It re-runs the simulator over every currently-open leak, then for
// anything at or above AUTO_RECOVERY_THRESHOLD success probability it
// self-initiates the workflow (status starts 'in_progress', first step
// already underway); everything below the threshold is queued as
// 'pending_review' for a human to greenlight. That threshold is the one
// dial that controls how much autonomy the agent has — turn it up and it
// only touches sure things, turn it down and it acts more aggressively.

const RevenueLeak = require('../models/RevenueLeak');
const HiddenLeak = require('../models/HiddenLeak');
const RecoveryWorkflow = require('../models/RecoveryWorkflow');

const AUTO_RECOVERY_THRESHOLD = Number(process.env.AUTO_RECOVERY_THRESHOLD || 60); // success-probability %

// How recoverable each kind of leak tends to be once you actually go after
// it — independent of how it was scored as a risk. An overdue payment is a
// clean chase; a discount that's already been invoiced and accepted by the
// customer is much harder to walk back.
const BASE_SUCCESS_PROBABILITY = {
    // Loud leaks (revenueRisk.js)
    OVERDUE_PAYMENT: 75,
    FAILED_RENEWAL: 55,
    UNUSUAL_DISCOUNT: 40,
    UNUSUAL_REFUND: 35,
    CHURN_RISK: 30,
    // Hidden leaks (leakageDetector.js)
    ORPHANED_COLLECTION: 80,
    DORMANT_BILLING: 65,
    SILENT_DOWNGRADE: 45,
    COMPOUNDING_MICRO_LEAK: 35,
};

// Upside factor applied to hidden leaks, which don't already carry a
// recoverableEstimate the way RevenueLeak items do (see revenueRisk.js's
// RECOVERY_FACTOR). Mirrors that same idea for the hidden-leak types.
const HIDDEN_RECOVERY_FACTOR = {
    SILENT_DOWNGRADE: 0.5,
    DORMANT_BILLING: 0.7,
    ORPHANED_COLLECTION: 0.85,
    COMPOUNDING_MICRO_LEAK: 0.35,
};

const CONFIDENCE_ADJUSTMENT = { high: 10, medium: 0, low: -10 };

// The concrete steps a workflow walks through to actually recover the
// money, distinct from (though inspired by) the "recommended actions"
// shown on the leak itself — these are phrased as an executable sequence.
const WORKFLOW_STEPS = {
    UNUSUAL_DISCOUNT: [
        'Flag transaction for manager review',
        'Confirm discount authorization on file',
        'Re-invoice the shortfall if unauthorized',
    ],
    UNUSUAL_REFUND: [
        'Verify refund against a return or complaint record',
        'Confirm no duplicate refund was issued',
        'Recover the shortfall if the refund was invalid',
    ],
    OVERDUE_PAYMENT: [
        'Send an automated payment reminder',
        'Escalate to collections past the grace period',
        'Confirm payment receipt and close out',
    ],
    FAILED_RENEWAL: [
        'Trigger the dunning email sequence',
        'Retry payment / prompt a card update',
        'Confirm the renewal processed',
    ],
    CHURN_RISK: [
        'Assign a customer-success owner',
        'Send a retention outreach',
        'Confirm continued engagement next cycle',
    ],
    SILENT_DOWNGRADE: [
        'Compare the current invoice against the contract baseline',
        'Confirm with the account owner whether a change was approved',
        'Re-bill the shortfall if no approved change is on file',
    ],
    DORMANT_BILLING: [
        'Verify the billing job actually ran for this customer',
        'Issue the missing invoice',
        'Confirm the invoice was delivered and accepted',
    ],
    ORPHANED_COLLECTION: [
        'Reconcile the invoice against the payment gateway / bank record',
        'Identify the missing or partial payment',
        'Escalate to finance ops to recover the shortfall',
    ],
    COMPOUNDING_MICRO_LEAK: [
        'Cap total discretionary discount per customer per period',
        'Review the rep/channel issuing the repeat discounts',
        'Add a rolling-total alert going forward',
    ],
};

function round2(n) {
    return Math.round((n || 0) * 100) / 100;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

/**
 * Simulates recovery for a single leak (either an open RevenueLeak or an
 * open HiddenLeak). Pure function — makes no decisions about persistence,
 * just projects the outcome and the decision the agent *would* make.
 */
function simulateLeak(leak, sourceType) {
    const base = BASE_SUCCESS_PROBABILITY[leak.type] ?? 40;
    const confidenceBonus = CONFIDENCE_ADJUSTMENT[leak.confidence] ?? 0;
    const riskAdjustment = round2(((leak.riskScore ?? 50) - 50) * 0.2);
    const successProbability = clamp(Math.round(base + confidenceBonus + riskAdjustment), 5, 95);

    const recoverableEstimate =
        sourceType === 'revenue_leak'
            ? round2(leak.recoverableEstimate ?? (leak.amountAtRisk || 0) * 0.5)
            : round2((leak.amountAtRisk || 0) * (HIDDEN_RECOVERY_FACTOR[leak.type] ?? 0.5));

    const expectedRecovery = round2(recoverableEstimate * (successProbability / 100));
    const decision = successProbability >= AUTO_RECOVERY_THRESHOLD ? 'auto_initiated' : 'needs_review';
    const status = decision === 'auto_initiated' ? 'in_progress' : 'pending_review';

    const stepTitles = WORKFLOW_STEPS[leak.type] || ['Investigate the leak', 'Determine recovery path', 'Confirm resolution'];
    const steps = stepTitles.map((action, i) => ({
        order: i + 1,
        action,
        status: decision === 'auto_initiated' && i === 0 ? 'in_progress' : 'pending',
    }));

    const simulationNote =
        decision === 'auto_initiated'
            ? `Simulated ${successProbability}% success probability (≥ ${AUTO_RECOVERY_THRESHOLD}% threshold) — agent self-initiated this workflow, projecting up to ₹${recoverableEstimate.toLocaleString(
                'en-IN'
            )} recovered (₹${expectedRecovery.toLocaleString('en-IN')} expected value).`
            : `Simulated ${successProbability}% success probability (below the ${AUTO_RECOVERY_THRESHOLD}% auto-action threshold) — queued for human review before acting, projecting up to ₹${recoverableEstimate.toLocaleString(
                'en-IN'
            )} recovered if approved.`;

    return {
        sourceType,
        sourceId: leak._id,
        leakType: leak.type,
        customerId: leak.customerId,
        customerName: leak.customerName,
        amountAtRisk: round2(leak.amountAtRisk || 0),
        recoverableEstimate,
        successProbability,
        expectedRecovery,
        decision,
        status,
        steps,
        simulationNote,
    };
}

/**
 * The Recovery Simulator: projects an outcome for every currently-open
 * leak without creating or touching any workflow. Read-only "what would
 * happen if we tried to recover this" pass.
 */
async function runRecoverySimulation() {
    const [revenueLeaks, hiddenLeaks] = await Promise.all([
        RevenueLeak.find({ status: 'open' }),
        HiddenLeak.find({ status: 'open' }),
    ]);

    const simulations = [
        ...revenueLeaks.map((l) => simulateLeak(l, 'revenue_leak')),
        ...hiddenLeaks.map((l) => simulateLeak(l, 'hidden_leak')),
    ].sort((a, b) => b.successProbability - a.successProbability);

    return { simulated: simulations.length, simulations };
}

/**
 * The Autonomous Recovery Agent: always simulates first (see above), then
 * persists a workflow for every leak — auto-initiated ones start already
 * in progress, everything else waits as pending_review. Replaces the
 * previous run's workflows, same point-in-time re-model pattern as the
 * digital twin and hidden-leakage engines.
 */
async function runAutonomousRecoveryAgent() {
    const { simulations } = await runRecoverySimulation();

    await RecoveryWorkflow.deleteMany({});
    if (simulations.length) await RecoveryWorkflow.insertMany(simulations);

    const autoInitiated = simulations.filter((s) => s.decision === 'auto_initiated').length;
    const totalProjectedRecovery = round2(simulations.reduce((s, w) => s + w.recoverableEstimate, 0));
    const totalExpectedRecovery = round2(simulations.reduce((s, w) => s + w.expectedRecovery, 0));

    return {
        simulated: simulations.length,
        autoInitiated,
        needsReview: simulations.length - autoInitiated,
        totalProjectedRecovery,
        totalExpectedRecovery,
    };
}

/**
 * Aggregate dashboard summary over the current set of workflows: how much
 * of the projected recovery the agent acted on by itself vs. queued for a
 * human, plus how much has actually been confirmed recovered so far.
 */
async function getRecoverySummary() {
    const workflows = await RecoveryWorkflow.find().lean();

    const byType = {};
    let totalProjectedRecovery = 0;
    let totalExpectedRecovery = 0;
    let totalRecovered = 0;
    let autoInitiatedCount = 0;
    let needsReviewCount = 0;
    let recoveredCount = 0;
    let failedCount = 0;

    for (const w of workflows) {
        byType[w.leakType] = (byType[w.leakType] || 0) + 1;
        totalProjectedRecovery += w.recoverableEstimate || 0;
        totalExpectedRecovery += w.expectedRecovery || 0;
        if (w.decision === 'auto_initiated') autoInitiatedCount += 1;
        if (w.decision === 'needs_review') needsReviewCount += 1;
        if (w.status === 'recovered') {
            recoveredCount += 1;
            totalRecovered += w.recoverableEstimate || 0;
        }
        if (w.status === 'failed') failedCount += 1;
    }

    // Rough read on how much autonomy is currently in play: share of
    // projected recovery the agent is driving without waiting on a human.
    const autonomyScore = workflows.length
        ? clamp(Math.round((autoInitiatedCount / workflows.length) * 100), 0, 100)
        : 0;

    return {
        autoRecoveryThreshold: AUTO_RECOVERY_THRESHOLD,
        totalWorkflows: workflows.length,
        autoInitiatedCount,
        needsReviewCount,
        recoveredCount,
        failedCount,
        autonomyScore,
        totalProjectedRecovery: round2(totalProjectedRecovery),
        totalExpectedRecovery: round2(totalExpectedRecovery),
        totalRecovered: round2(totalRecovered),
        byType,
    };
}

const VALID_STATUSES = RecoveryWorkflow.STATUSES;

async function updateWorkflowStatus(id, status) {
    if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`), { status: 400 });
    }
    const workflow = await RecoveryWorkflow.findById(id);
    if (!workflow) throw Object.assign(new Error('Workflow not found'), { status: 404 });

    workflow.status = status;
    if (status === 'recovered' || status === 'failed' || status === 'cancelled') {
        workflow.steps = (workflow.steps || []).map((s) => ({
            ...s,
            status: status === 'recovered' ? 'done' : s.status,
        }));
    } else if (status === 'in_progress') {
        workflow.steps = (workflow.steps || []).map((s, i) => ({
            ...s,
            status: i === 0 && s.status === 'pending' ? 'in_progress' : s.status,
        }));
    }
    await workflow.save();
    return workflow;
}

module.exports = {
    runRecoverySimulation,
    runAutonomousRecoveryAgent,
    getRecoverySummary,
    updateWorkflowStatus,
    AUTO_RECOVERY_THRESHOLD,
};
