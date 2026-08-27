// Revenue Leak Digital Twin + "What You Should Have Earned" Engine.
//
// This builds a lightweight "twin" of each customer's expected revenue
// trajectory and compares it against what was actually billed/collected.
// It's the same artifact as the expected-vs-actual engine: the whole point
// of modeling a twin here is to produce that comparison.
//
// Expected ("what they should have earned") is modeled as the higher of:
//   - the customer's own historical run-rate (previousPeriodSpend), i.e.
//     "if nothing had changed, this is what continues"
//   - what finance actually invoiced them this period (sum of amountDue)
// Taking the max means a customer who was invoiced *more* than their old
// run-rate is still expected to pay it in full, and a customer who was
// invoiced *less* than their own history (without churning or a contract
// ending) still shows a gap — that under-billing is exactly the kind of
// silent leak this module exists to surface.
//
// Actual ("what was realized") is the best available signal of realized
// cash: amountPaid from payment records, falling back to net transaction
// value (gross - discount - refund) when a customer has transaction data
// but no payment records on file at all.
//
// Every twin snapshot is intentionally traceable back to the raw numbers
// that produced it — no black box, same philosophy as the rest of the app.

const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const ExpectedRevenue = require('../models/ExpectedRevenue');

const TWIN_GAP_FLAG_PCT = Number(process.env.TWIN_GAP_FLAG_PCT || 10); // % gap considered a leak
const TWIN_GAP_FLOOR = Number(process.env.TWIN_GAP_FLOOR || 500); // ignore noise below this ₹ gap

function round2(n) {
    return Math.round((n || 0) * 100) / 100;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function sumBy(list, fn) {
    return list.reduce((acc, item) => acc + (fn(item) || 0), 0);
}

/**
 * Builds one digital-twin snapshot for a single customer from the raw
 * transaction/payment feeds. Exported standalone so the hidden-leakage
 * detector can reuse the exact same modeling logic.
 */
function buildTwinSnapshot(customer, transactions, payments, now) {
    const custTxns = transactions.filter((t) => t.customerId === customer.customerId);
    const custPayments = payments.filter((p) => p.customerId === customer.customerId);

    const billedAmount = round2(sumBy(custPayments, (p) => p.amountDue));
    const collectedAmount = round2(sumBy(custPayments, (p) => p.amountPaid));

    const netTransactionAmount = round2(
        sumBy(
            custTxns.filter((t) => !t.isRefund),
            (t) => t.grossAmount - t.discountAmount
        ) - sumBy(custTxns.filter((t) => t.isRefund), (t) => t.refundAmount)
    );

    const contractEnded = customer.contractEndDate && new Date(customer.contractEndDate) < now;

    const runRate = customer.previousPeriodSpend || customer.currentPeriodSpend || 0;
    const expectedRevenue = contractEnded ? 0 : round2(Math.max(runRate, billedAmount));

    const hasPaymentData = custPayments.length > 0;
    const actualRevenue = hasPaymentData ? collectedAmount : round2(Math.max(collectedAmount, netTransactionAmount));

    const gapRaw = round2(expectedRevenue - actualRevenue);
    const gap = gapRaw > 0 ? gapRaw : 0;
    const gapPct = expectedRevenue > 0 ? round2((gap / expectedRevenue) * 100) : 0;

    const isLeaking = !contractEnded && gap >= TWIN_GAP_FLOOR && gapPct >= TWIN_GAP_FLAG_PCT;

    let confidence = 'low';
    if (customer.previousPeriodSpend && hasPaymentData) confidence = 'high';
    else if (customer.previousPeriodSpend || hasPaymentData) confidence = 'medium';

    return {
        customerId: customer.customerId,
        customerName: customer.name,
        billedAmount,
        collectedAmount,
        netTransactionAmount,
        runRate: round2(runRate),
        expectedRevenue,
        actualRevenue,
        gap,
        gapPct,
        confidence,
        contractEnded: !!contractEnded,
        status: contractEnded ? 'contract_closed' : isLeaking ? 'leaking' : 'on_track',
        explanation: contractEnded
            ? `Contract on file ended ${new Date(customer.contractEndDate).toISOString().slice(0, 10)} — no revenue expected.`
            : isLeaking
                ? `Twin expected ₹${expectedRevenue.toLocaleString('en-IN')} (run-rate/billed baseline) but only ₹${actualRevenue.toLocaleString(
                    'en-IN'
                )} was realized — a ${gapPct}% gap.`
                : `Realized revenue (₹${actualRevenue.toLocaleString('en-IN')}) is tracking within ${gapPct}% of the ₹${expectedRevenue.toLocaleString(
                    'en-IN'
                )} the twin expected.`,
    };
}

/**
 * Runs the digital twin across every customer currently loaded, replacing
 * any prior 'open' snapshots (this is a point-in-time re-model, not a
 * feedback-adjusted score like the GST engine).
 */
async function runDigitalTwin() {
    const [transactions, payments, customers] = await Promise.all([
        Transaction.find(),
        Payment.find(),
        Customer.find(),
    ]);

    const now = new Date();
    const snapshots = customers.map((c) => buildTwinSnapshot(c, transactions, payments, now));

    // Clear every prior run's snapshots regardless of what status they ended up in.
    await ExpectedRevenue.deleteMany({});
    if (snapshots.length) await ExpectedRevenue.insertMany(snapshots);

    return { created: snapshots.length, leaking: snapshots.filter((s) => s.status === 'leaking').length };
}

/**
 * Aggregate dashboard summary: overall twin health score, totals, and the
 * biggest expected-vs-actual gaps.
 */
async function getTwinSummary() {
    const snapshots = await ExpectedRevenue.find().lean();

    const totalExpected = round2(sumBy(snapshots, (s) => s.expectedRevenue));
    const totalActual = round2(sumBy(snapshots, (s) => s.actualRevenue));
    const totalGap = round2(sumBy(snapshots, (s) => s.gap));
    const leaking = snapshots.filter((s) => s.status === 'leaking');

    // Twin health score: 100 = fully realized, drops with the overall gap ratio.
    const twinHealthScore = totalExpected > 0 ? clamp(Math.round(100 - (totalGap / totalExpected) * 100), 0, 100) : 100;

    const topGaps = [...snapshots].sort((a, b) => b.gap - a.gap).slice(0, 10);

    return {
        twinHealthScore,
        customersModeled: snapshots.length,
        leakingCustomerCount: leaking.length,
        totalExpected,
        totalActual,
        totalGap,
        topGaps,
    };
}

module.exports = { runDigitalTwin, getTwinSummary, buildTwinSnapshot };
