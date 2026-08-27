// Revenue Leakage & Customer-Risk Engine.
//
// Analyzes transaction, payment/invoice, and customer data together to:
//   1. Detect unusual discounts and refunds
//   2. Detect overdue payments and failed renewals
//   3. Predict customers likely to churn
//   4. Produce a 0-100 revenue-risk score, per-item + overall
//   5. Explain *why* each item was flagged, in plain language
//   6. Estimate potentially recoverable revenue
//   7. Recommend corrective actions
//
// Like the GST reconciliation engine, this is intentionally a transparent,
// rule-based model rather than a black box: every score traces back to
// numbers finance/ops teams can verify.

const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const RevenueLeak = require('../models/RevenueLeak');

const DISCOUNT_FLAG_PCT = Number(process.env.DISCOUNT_FLAG_PCT || 25); // % off considered "unusual"
const REFUND_FLAG_PCT = Number(process.env.REFUND_FLAG_PCT || 40); // refund as % of original amount
const OVERDUE_GRACE_DAYS = Number(process.env.OVERDUE_GRACE_DAYS || 15);
const CHURN_FLAG_SCORE = Number(process.env.CHURN_FLAG_SCORE || 55);

const RECOVERY_FACTOR = {
    UNUSUAL_DISCOUNT: 0.6,
    UNUSUAL_REFUND: 0.4,
    OVERDUE_PAYMENT: 0.8,
    FAILED_RENEWAL: 0.5,
    CHURN_RISK: 0.3,
};

const RECOMMENDED_ACTIONS = {
    UNUSUAL_DISCOUNT: [
        'Route discounts above policy threshold through manager approval before invoicing',
        'Audit the sales rep / channel issuing this discount for a pattern',
        'Compare against the standard discount ladder for this customer segment',
    ],
    UNUSUAL_REFUND: [
        'Verify the refund against a matching return, credit note, or complaint ticket',
        'Flag repeat-refund customers or products for a root-cause review',
        'Tighten refund-approval limits for front-line staff',
    ],
    OVERDUE_PAYMENT: [
        'Send an automated payment reminder and escalate past 30 days overdue',
        'Offer a short-term payment plan before involving collections',
        'Pause non-essential services/renewals until the balance clears',
    ],
    FAILED_RENEWAL: [
        'Trigger an immediate win-back / dunning email sequence',
        'Have account management call before the grace period lapses',
        'Check for a card-expiry or billing-detail failure and prompt an update',
    ],
    CHURN_RISK: [
        'Proactively reach out with a retention offer or check-in call',
        'Review recent support tickets for unresolved complaints',
        'Assign a customer-success owner for the next renewal cycle',
    ],
};

function daysBetween(a, b) {
    return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function round2(n) {
    return Math.round((n || 0) * 100) / 100;
}

/**
 * Runs the full revenue-risk pass over all transactions, payments and
 * customers currently loaded, replacing any existing 'open' leaks (reviewed
 * ones are kept as history).
 */
async function runRevenueAnalysis() {
    const [transactions, payments, customers] = await Promise.all([
        Transaction.find(),
        Payment.find(),
        Customer.find(),
    ]);

    const found = [];
    const now = new Date();

    found.push(...detectUnusualDiscounts(transactions));
    found.push(...detectUnusualRefunds(transactions));
    found.push(...detectOverduePayments(payments, now));
    found.push(...detectFailedRenewals(payments));
    found.push(...detectChurnRisk(customers, payments, now));

    await RevenueLeak.deleteMany({ status: 'open' });
    if (found.length) await RevenueLeak.insertMany(found);

    return { created: found.length };
}

function detectUnusualDiscounts(transactions) {
    const sales = transactions.filter((t) => !t.isRefund && t.grossAmount > 0);
    if (!sales.length) return [];

    const pcts = sales.map((t) => (t.discountAmount / t.grossAmount) * 100);
    const avgPct = pcts.reduce((a, b) => a + b, 0) / pcts.length;

    const out = [];
    for (const t of sales) {
        const pct = (t.discountAmount / t.grossAmount) * 100;
        if (pct >= DISCOUNT_FLAG_PCT && pct > avgPct * 1.5) {
            const riskScore = clamp(Math.round(40 + pct), 0, 100);
            out.push({
                type: 'UNUSUAL_DISCOUNT',
                customerId: t.customerId,
                customerName: t.customerName,
                refId: t.transactionNo,
                amountAtRisk: round2(t.discountAmount),
                riskScore,
                details: `${t.discountAmount ? round2(pct) : 0}% discount on transaction ${t.transactionNo} (₹${round2(
                    t.grossAmount
                )}) — well above the ${round2(avgPct)}% average across all sales.`,
                recoverableEstimate: round2(t.discountAmount * RECOVERY_FACTOR.UNUSUAL_DISCOUNT),
                recommendedActions: RECOMMENDED_ACTIONS.UNUSUAL_DISCOUNT,
                status: 'open',
            });
        }
    }
    return out;
}

function detectUnusualRefunds(transactions) {
    const refunds = transactions.filter((t) => t.isRefund && t.refundAmount > 0);
    const byCustomer = new Map();
    for (const r of refunds) {
        byCustomer.set(r.customerId, (byCustomer.get(r.customerId) || 0) + 1);
    }

    const out = [];
    for (const r of refunds) {
        const pctOfOriginal = r.grossAmount > 0 ? (r.refundAmount / r.grossAmount) * 100 : 100;
        const repeatCount = byCustomer.get(r.customerId) || 1;
        const isUnusual = pctOfOriginal >= REFUND_FLAG_PCT || repeatCount >= 3;
        if (!isUnusual) continue;

        const riskScore = clamp(Math.round(30 + pctOfOriginal / 2 + repeatCount * 5), 0, 100);
        out.push({
            type: 'UNUSUAL_REFUND',
            customerId: r.customerId,
            customerName: r.customerName,
            refId: r.transactionNo,
            amountAtRisk: round2(r.refundAmount),
            riskScore,
            details:
                repeatCount >= 3
                    ? `${repeatCount} refunds recorded for this customer, including ₹${round2(
                        r.refundAmount
                    )} on transaction ${r.transactionNo} — a repeat-refund pattern.`
                    : `Refund of ₹${round2(r.refundAmount)} is ${round2(pctOfOriginal)}% of the original ₹${round2(
                        r.grossAmount
                    )} transaction ${r.transactionNo}.`,
            recoverableEstimate: round2(r.refundAmount * RECOVERY_FACTOR.UNUSUAL_REFUND),
            recommendedActions: RECOMMENDED_ACTIONS.UNUSUAL_REFUND,
            status: 'open',
        });
    }
    return out;
}

function detectOverduePayments(payments, now) {
    const out = [];
    for (const p of payments) {
        if (p.status === 'paid' || !p.dueDate) continue;
        const overdueDays = daysBetween(now, p.dueDate);
        if (overdueDays <= OVERDUE_GRACE_DAYS) continue;

        const outstanding = round2((p.amountDue || 0) - (p.amountPaid || 0));
        if (outstanding <= 0) continue;

        const riskScore = clamp(Math.round(30 + overdueDays / 2), 0, 100);
        out.push({
            type: 'OVERDUE_PAYMENT',
            customerId: p.customerId,
            customerName: p.customerName,
            refId: p.paymentId || p.invoiceNo,
            amountAtRisk: outstanding,
            riskScore,
            details: `₹${outstanding.toLocaleString('en-IN')} outstanding on invoice ${p.invoiceNo
                }, ${overdueDays} days past due date (${new Date(p.dueDate).toISOString().slice(0, 10)}).`,
            recoverableEstimate: round2(outstanding * RECOVERY_FACTOR.OVERDUE_PAYMENT),
            recommendedActions: RECOMMENDED_ACTIONS.OVERDUE_PAYMENT,
            status: 'open',
        });
    }
    return out;
}

function detectFailedRenewals(payments) {
    const out = [];
    for (const p of payments) {
        if (p.renewalStatus !== 'failed_renewal') continue;
        const amount = round2(p.amountDue || 0);
        const riskScore = clamp(Math.round(55 + amount / 1000), 0, 100);
        out.push({
            type: 'FAILED_RENEWAL',
            customerId: p.customerId,
            customerName: p.customerName,
            refId: p.paymentId || p.invoiceNo,
            amountAtRisk: amount,
            riskScore,
            details: `Subscription/contract renewal for invoice ${p.invoiceNo} (₹${amount.toLocaleString(
                'en-IN'
            )}) failed to process.`,
            recoverableEstimate: round2(amount * RECOVERY_FACTOR.FAILED_RENEWAL),
            recommendedActions: RECOMMENDED_ACTIONS.FAILED_RENEWAL,
            status: 'open',
        });
    }
    return out;
}

/**
 * Simple, explainable churn model: weighted score from purchase recency,
 * spend trend, support complaints, and any failed renewal on file.
 */
function computeChurnScore(customer, hasFailedRenewal, now) {
    const reasons = [];
    let score = 0;

    const recencyDays = customer.lastPurchaseDate ? daysBetween(now, customer.lastPurchaseDate) : null;
    if (recencyDays !== null) {
        if (recencyDays > 120) {
            score += 35;
            reasons.push(`no purchase in ${recencyDays} days`);
        } else if (recencyDays > 60) {
            score += 20;
            reasons.push(`no purchase in ${recencyDays} days`);
        }
    }

    const prev = customer.previousPeriodSpend || 0;
    const curr = customer.currentPeriodSpend || 0;
    if (prev > 0) {
        const changePct = ((curr - prev) / prev) * 100;
        if (changePct <= -50) {
            score += 30;
            reasons.push(`spend down ${Math.abs(round2(changePct))}% vs. last period`);
        } else if (changePct <= -20) {
            score += 15;
            reasons.push(`spend down ${Math.abs(round2(changePct))}% vs. last period`);
        }
    } else if (curr === 0) {
        score += 15;
        reasons.push('no spend recorded this period');
    }

    const complaints = customer.supportComplaints || 0;
    if (complaints >= 3) {
        score += 20;
        reasons.push(`${complaints} unresolved support complaints`);
    } else if (complaints >= 1) {
        score += 8;
        reasons.push(`${complaints} recent support complaint(s)`);
    }

    if (hasFailedRenewal) {
        score += 25;
        reasons.push('a recent renewal failed to process');
    }

    return { score: clamp(Math.round(score), 0, 100), reasons };
}

function detectChurnRisk(customers, payments, now) {
    const failedRenewalCustomers = new Set(
        payments.filter((p) => p.renewalStatus === 'failed_renewal').map((p) => p.customerId)
    );

    const out = [];
    for (const c of customers) {
        const { score, reasons } = computeChurnScore(c, failedRenewalCustomers.has(c.customerId), now);
        if (score < CHURN_FLAG_SCORE) continue;

        const atRiskRevenue = round2(c.currentPeriodSpend || c.previousPeriodSpend || 0);
        out.push({
            type: 'CHURN_RISK',
            customerId: c.customerId,
            customerName: c.name,
            refId: c.customerId,
            amountAtRisk: atRiskRevenue,
            riskScore: score,
            details: `Predicted likely to churn: ${reasons.join(', ')}.`,
            recoverableEstimate: round2(atRiskRevenue * RECOVERY_FACTOR.CHURN_RISK),
            recommendedActions: RECOMMENDED_ACTIONS.CHURN_RISK,
            status: 'open',
        });
    }
    return out.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Aggregate dashboard summary: overall revenue-risk score (0-100), totals,
 * breakdown by leak type, and top at-risk customers.
 */
async function getSummary() {
    const leaks = await RevenueLeak.find({ status: 'open' }).lean();

    const byType = {};
    let totalAtRisk = 0;
    let totalRecoverable = 0;
    for (const l of leaks) {
        byType[l.type] = (byType[l.type] || 0) + 1;
        totalAtRisk += l.amountAtRisk || 0;
        totalRecoverable += l.recoverableEstimate || 0;
    }

    const overallScore = leaks.length
        ? clamp(Math.round(leaks.reduce((sum, l) => sum + l.riskScore, 0) / leaks.length), 0, 100)
        : 0;

    const churnRisks = leaks
        .filter((l) => l.type === 'CHURN_RISK')
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

    return {
        revenueRiskScore: overallScore,
        openLeakCount: leaks.length,
        totalAtRisk: round2(totalAtRisk),
        totalRecoverable: round2(totalRecoverable),
        byType,
        churnRisks,
    };
}

module.exports = { runRevenueAnalysis, getSummary, LEAK_TYPES: RevenueLeak.LEAK_TYPES };