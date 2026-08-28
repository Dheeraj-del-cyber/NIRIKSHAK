const express = require('express');
const RecoveryWorkflow = require('../models/RecoveryWorkflow');
const RevenueLeak = require('../models/RevenueLeak');
const {
    runRecoverySimulation,
    runAutonomousRecoveryAgent,
    getRecoverySummary,
    updateWorkflowStatus,
} = require('../services/recoveryEngine');

const router = express.Router();

// POST /api/recovery/simulate - Recovery Simulator: projects an outcome for
// every open leak without creating or touching any workflow.
router.post('/simulate', async (req, res) => {
    try {
        // If no leaks exist yet, seed some demo ones so the simulator has data
        const leakCount = await RevenueLeak.countDocuments({ status: 'open' });
        if (leakCount === 0) {
            await seedDemoLeaks();
        }
        const result = await runRecoverySimulation();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recovery/run - Autonomous Recovery Agent: simulates first, then
// auto-creates a workflow for anything at/above the success-probability
// threshold and queues the rest for review.
router.post('/run', async (req, res) => {
    try {
        // If no leaks exist yet, seed demo ones
        const leakCount = await RevenueLeak.countDocuments({ status: 'open' });
        if (leakCount === 0) {
            await seedDemoLeaks();
        }
        const result = await runAutonomousRecoveryAgent();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/recovery/summary - autonomy score, projected/expected/recovered
// totals, breakdown by leak type.
router.get('/summary', async (req, res) => {
    try {
        res.json(await getRecoverySummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/recovery/workflows?decision=&status=&leakType= - current workflows
router.get('/workflows', async (req, res) => {
    try {
        const filter = {};
        if (req.query.decision) filter.decision = req.query.decision;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.leakType) filter.leakType = req.query.leakType;
        const workflows = await RecoveryWorkflow.find(filter).sort({ successProbability: -1 });
        res.json(workflows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/recovery/workflows/:id/status - move a workflow along
// (in_progress -> recovered/failed/cancelled), e.g. after a human reviews
// and approves a pending_review workflow.
router.patch('/workflows/:id/status', async (req, res) => {
    try {
        const workflow = await updateWorkflowStatus(req.params.id, req.body.status);
        res.json(workflow);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// Helper: insert demo RevenueLeak records so Recovery Engine has data to work with
async function seedDemoLeaks() {
    const now = new Date();
    const pastDate = (days) => new Date(now.getTime() - days * 86400000).toISOString();
    const demoLeaks = [
        { type: 'OVERDUE_PAYMENT', customerId: 'C001', customerName: 'Apex Retail Ltd', refId: 'PAY-3001', amountAtRisk: 20000, riskScore: 72, details: '₹20,000 outstanding on invoice INV-2001, 35 days past due.', recoverableEstimate: 16000, recommendedActions: ['Send automated reminder', 'Escalate to collections'], status: 'open' },
        { type: 'UNUSUAL_DISCOUNT', customerId: 'C001', customerName: 'Apex Retail Ltd', refId: 'TXN-1001', amountAtRisk: 20000, riskScore: 80, details: '40% discount on TXN-1001 — well above 8% average.', recoverableEstimate: 12000, recommendedActions: ['Route through manager approval', 'Audit sales rep'], status: 'open' },
        { type: 'FAILED_RENEWAL', customerId: 'C005', customerName: 'TechVista Corp', refId: 'PAY-3004', amountAtRisk: 40000, riskScore: 85, details: 'Renewal for INV-2008 (₹40,000) failed to process.', recoverableEstimate: 20000, recommendedActions: ['Trigger dunning email', 'Check card expiry'], status: 'open' },
        { type: 'CHURN_RISK', customerId: 'C005', customerName: 'TechVista Corp', refId: 'C005', amountAtRisk: 12000, riskScore: 78, details: 'Predicted likely to churn: no purchase in 200 days, spend down 87%, 5 support complaints.', recoverableEstimate: 3600, recommendedActions: ['Reach out with retention offer', 'Assign CSM'], status: 'open' },
        { type: 'UNUSUAL_REFUND', customerId: 'C003', customerName: 'BlueOcean Logistics', refId: 'TXN-1004', amountAtRisk: 30000, riskScore: 68, details: '3 refunds recorded for this customer — repeat-refund pattern.', recoverableEstimate: 12000, recommendedActions: ['Verify against return records', 'Tighten refund limits'], status: 'open' },
        { type: 'OVERDUE_PAYMENT', customerId: 'C003', customerName: 'BlueOcean Logistics', refId: 'INV-2003', amountAtRisk: 15000, riskScore: 60, details: '₹15,000 outstanding, 22 days past due.', recoverableEstimate: 12000, recommendedActions: ['Payment reminder', 'Offer payment plan'], status: 'open' },
    ];
    await RevenueLeak.insertMany(demoLeaks);
}

module.exports = router;
