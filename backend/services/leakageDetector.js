// Hidden Leakage Detector + Leakage Chain Detection.
//
// The existing revenueRisk.js engine catches leaks that show up as a single
// loud signal in one dataset (one big discount, one overdue invoice, one
// churny customer). This module is for the leaks that hide *between* the
// datasets — a customer never got invoiced at all, a payment says "paid"
// but was never fully collected, or a pile of individually-tiny discounts
// quietly bleeds real money. None of those trip an individual threshold.
//
// Chain detection is not a separate scan — it's the root-cause trail we
// attach to every hidden leak we do find, built by walking the customer's
// records across Transactions, Payments, the digital twin, and the
// already-open RevenueLeak list, in order from most direct evidence to
// most circumstantial. That chain is what turns "there's a gap" into
// "here's why, and here's the paper trail" for whoever has to investigate it.

const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const RevenueLeak = require('../models/RevenueLeak');
const HiddenLeak = require('../models/HiddenLeak');
const { buildTwinSnapshot } = require('./digitalTwin');

const DORMANCY_DAYS = Number(process.env.DORMANCY_DAYS || 45); // recent-enough to expect billing
const MICRO_LEAK_MIN_COUNT = Number(process.env.MICRO_LEAK_MIN_COUNT || 3);
const MICRO_LEAK_MIN_TOTAL = Number(process.env.MICRO_LEAK_MIN_TOTAL || 3000);

const RECOMMENDED_ACTIONS = {
    SILENT_DOWNGRADE: [
        'Compare the current invoice line-up against the signed contract/price list',
        'Ask the account owner whether a discount or scope change was approved but not logged',
        'Re-bill the shortfall if no approved change is on file',
    ],
    DORMANT_BILLING: [
        'Confirm the billing job actually ran for this customer this cycle',
        'Check for a broken integration, expired card, or missing invoice trigger',
        'Manually issue the missing invoice if the customer is still active',
    ],
    ORPHANED_COLLECTION: [
        'Reconcile this invoice number against the payment gateway/bank statement directly',
        'Check for a partial payment or duplicate invoice that split the collection',
        'Escalate to finance ops before writing off the shortfall',
    ],
    COMPOUNDING_MICRO_LEAK: [
        'Cap total discretionary discount per customer per period, not just per transaction',
        'Review whichever rep/channel is issuing the recurring small discounts',
        'Add a rolling-total alert instead of relying on single-transaction thresholds',
    ],
};

function round2(n) {
    return Math.round((n || 0) * 100) / 100;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function daysBetween(a, b) {
    return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

/**
 * Builds the root-cause chain for a hidden leak: an ordered trail of facts
 * pulled from every dataset that touches this customer, most-direct
 * evidence first, ending in a plain-language root-cause hypothesis.
 */
function buildChain(customer, custTxns, custPayments, openLeaksForCustomer, twinSnapshot, rootCauseHypothesis) {
    const chain = [];

    chain.push({
        step: chain.length + 1,
        source: 'Digital Twin',
        signal: `Expected ₹${twinSnapshot.expectedRevenue.toLocaleString('en-IN')} vs. realized ₹${twinSnapshot.actualRevenue.toLocaleString(
            'en-IN'
        )} (${twinSnapshot.gapPct}% gap, confidence: ${twinSnapshot.confidence}).`,
    });

    chain.push({
        step: chain.length + 1,
        source: 'Existing leak scan',
        signal: openLeaksForCustomer.length
            ? `${openLeaksForCustomer.length} open leak(s) already on file: ${openLeaksForCustomer
                .map((l) => l.type)
                .join(', ')} — none of them fully account for this gap.`
            : 'No unusual discount, refund, overdue-payment, or renewal-failure was flagged for this customer — the gap has no visible paper trail.',
    });

    chain.push({
        step: chain.length + 1,
        source: 'Payments',
        signal: custPayments.length
            ? `${custPayments.length} payment record(s) on file, totalling ₹${round2(
                custPayments.reduce((s, p) => s + (p.amountDue || 0), 0)
            ).toLocaleString('en-IN')} billed vs. ₹${round2(
                custPayments.reduce((s, p) => s + (p.amountPaid || 0), 0)
            ).toLocaleString('en-IN')} collected.`
            : 'No payment records exist for this customer at all in the current dataset.',
    });

    chain.push({
        step: chain.length + 1,
        source: 'Transactions',
        signal: custTxns.length
            ? `${custTxns.length} transaction(s) on file, most recent dated ${new Date(
                custTxns.reduce((latest, t) => (new Date(t.transactionDate) > new Date(latest) ? t.transactionDate : latest), custTxns[0].transactionDate)
            )
                .toISOString()
                .slice(0, 10)}.`
            : 'No transaction/billing-line activity on file for this customer.',
    });

    chain.push({
        step: chain.length + 1,
        source: 'Customer profile',
        signal: `Last purchase: ${customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString().slice(0, 10) : 'unknown'}, support complaints: ${customer.supportComplaints || 0
            }, contract end: ${customer.contractEndDate ? new Date(customer.contractEndDate).toISOString().slice(0, 10) : 'none on file'}.`,
    });

    chain.push({
        step: chain.length + 1,
        source: 'Root-cause hypothesis',
        signal: rootCauseHypothesis,
    });

    return chain;
}

function detectSilentDowngrades(customers, transactions, payments, openLeaks, now) {
    const out = [];
    for (const c of customers) {
        const snapshot = buildTwinSnapshot(c, transactions, payments, now);
        if (snapshot.status !== 'leaking') continue;

        const custPayments = payments.filter((p) => p.customerId === c.customerId);
        // Only "hidden" if there IS payment history (so this isn't dormant billing)
        // and the gap isn't already explained by an obvious open leak.
        if (!custPayments.length) continue;

        const custTxns = transactions.filter((t) => t.customerId === c.customerId);
        const openForCustomer = openLeaks.filter((l) => l.customerId === c.customerId);
        const explained = openForCustomer.some((l) =>
            ['UNUSUAL_DISCOUNT', 'OVERDUE_PAYMENT', 'FAILED_RENEWAL'].includes(l.type)
        );
        if (explained) continue;

        const riskScore = clamp(Math.round(45 + snapshot.gapPct / 2), 0, 100);
        const chain = buildChain(
            c,
            custTxns,
            custPayments,
            openForCustomer,
            snapshot,
            `Customer is still active and being billed, but consistently below their own run-rate with no approved discount, refund, or overdue flag on file — points to an un-logged scope reduction or under-billing.`
        );

        out.push({
            type: 'SILENT_DOWNGRADE',
            customerId: c.customerId,
            customerName: c.name,
            amountAtRisk: snapshot.gap,
            riskScore,
            confidence: snapshot.confidence,
            summary: `₹${snapshot.gap.toLocaleString('en-IN')} gap between run-rate and realized revenue with no matching leak on file.`,
            chain,
            recommendedActions: RECOMMENDED_ACTIONS.SILENT_DOWNGRADE,
            status: 'open',
        });
    }
    return out;
}

function detectDormantBilling(customers, transactions, payments, openLeaks, now) {
    const out = [];
    for (const c of customers) {
        const custPayments = payments.filter((p) => p.customerId === c.customerId);
        if (custPayments.length) continue; // has billing history — not dormant
        if (!c.lastPurchaseDate) continue;

        const recencyDays = daysBetween(now, c.lastPurchaseDate);
        if (recencyDays > DORMANCY_DAYS) continue; // too stale to expect current billing anyway
        if ((c.currentPeriodSpend || 0) <= 0 && (c.previousPeriodSpend || 0) <= 0) continue; // never a paying customer

        const custTxns = transactions.filter((t) => t.customerId === c.customerId);
        const snapshot = buildTwinSnapshot(c, transactions, payments, now);
        const openForCustomer = openLeaks.filter((l) => l.customerId === c.customerId);
        const amountAtRisk = round2(c.previousPeriodSpend || c.currentPeriodSpend || 0);
        const riskScore = clamp(Math.round(50 + Math.max(0, DORMANCY_DAYS - recencyDays) / 2), 0, 100);

        const chain = buildChain(
            c,
            custTxns,
            custPayments,
            openForCustomer,
            snapshot,
            `Customer purchased as recently as ${recencyDays} day(s) ago with an established spend history, but has zero payment records this period — the billing pipeline likely never fired for them.`
        );

        out.push({
            type: 'DORMANT_BILLING',
            customerId: c.customerId,
            customerName: c.name,
            amountAtRisk,
            riskScore,
            confidence: 'medium',
            summary: `Active customer (last purchase ${recencyDays}d ago) with no payment record on file this period.`,
            chain,
            recommendedActions: RECOMMENDED_ACTIONS.DORMANT_BILLING,
            status: 'open',
        });
    }
    return out;
}

function detectOrphanedCollections(customers, transactions, payments, openLeaks, now) {
    const out = [];
    const byCustomer = new Map();
    for (const p of payments) {
        if (!byCustomer.has(p.customerId)) byCustomer.set(p.customerId, []);
        byCustomer.get(p.customerId).push(p);
    }

    for (const [customerId, custPayments] of byCustomer.entries()) {
        const customer = customers.find((c) => c.customerId === customerId);
        if (!customer) continue;

        // "Paid" on paper, but not actually paid in full, and not already caught
        // as an overdue payment (which requires status !== paid).
        const shortfallPaid = custPayments.filter(
            (p) => p.status === 'paid' && round2((p.amountDue || 0) - (p.amountPaid || 0)) > 0
        );
        if (!shortfallPaid.length) continue;

        const shortfall = round2(shortfallPaid.reduce((s, p) => s + ((p.amountDue || 0) - (p.amountPaid || 0)), 0));
        if (shortfall <= 0) continue;

        const custTxns = transactions.filter((t) => t.customerId === customerId);
        const openForCustomer = openLeaks.filter((l) => l.customerId === customerId);
        const snapshot = buildTwinSnapshot(customer, transactions, payments, now);
        const riskScore = clamp(Math.round(40 + shortfall / 500), 0, 100);

        const chain = buildChain(
            customer,
            custTxns,
            custPayments,
            openForCustomer,
            snapshot,
            `${shortfallPaid.length} invoice(s) are marked "paid" in the system but the collected amount is short of what was billed — the shortfall is invisible unless someone reconciles amountDue against amountPaid directly, since status alone reads as fully settled.`
        );

        out.push({
            type: 'ORPHANED_COLLECTION',
            customerId,
            customerName: customer.name,
            amountAtRisk: shortfall,
            riskScore,
            confidence: 'high',
            summary: `${shortfallPaid.length} invoice(s) marked paid but short by ₹${shortfall.toLocaleString('en-IN')} total.`,
            chain,
            recommendedActions: RECOMMENDED_ACTIONS.ORPHANED_COLLECTION,
            status: 'open',
        });
    }
    return out;
}

function detectCompoundingMicroLeaks(customers, transactions, payments, openLeaks, now) {
    const out = [];
    const byCustomer = new Map();
    for (const t of transactions) {
        if (t.isRefund ? t.refundAmount <= 0 : t.discountAmount <= 0) continue;
        if (!byCustomer.has(t.customerId)) byCustomer.set(t.customerId, []);
        byCustomer.get(t.customerId).push(t);
    }

    for (const [customerId, custTxns] of byCustomer.entries()) {
        if (custTxns.length < MICRO_LEAK_MIN_COUNT) continue;

        const total = round2(
            custTxns.reduce((s, t) => s + (t.isRefund ? t.refundAmount : t.discountAmount), 0)
        );
        if (total < MICRO_LEAK_MIN_TOTAL) continue;

        const customer = customers.find((c) => c.customerId === customerId);
        if (!customer) continue;

        const custPayments = payments.filter((p) => p.customerId === customerId);
        const openForCustomer = openLeaks.filter((l) => l.customerId === customerId);
        // Only "hidden" if none of these individual transactions already produced
        // an open UNUSUAL_DISCOUNT/UNUSUAL_REFUND leak — otherwise it's already visible.
        const alreadyCaught = openForCustomer.some((l) => ['UNUSUAL_DISCOUNT', 'UNUSUAL_REFUND'].includes(l.type));
        if (alreadyCaught) continue;

        const snapshot = buildTwinSnapshot(customer, transactions, payments, now);
        const riskScore = clamp(Math.round(35 + custTxns.length * 5 + total / 500), 0, 100);

        const chain = buildChain(
            customer,
            custTxns,
            custPayments,
            openForCustomer,
            snapshot,
            `${custTxns.length} individually small discounts/refunds, each under the single-transaction flag threshold, add up to ₹${total.toLocaleString(
                'en-IN'
            )} — invisible to a per-transaction scan but real money in aggregate.`
        );

        out.push({
            type: 'COMPOUNDING_MICRO_LEAK',
            customerId,
            customerName: customer.name,
            amountAtRisk: total,
            riskScore,
            confidence: 'medium',
            summary: `${custTxns.length} sub-threshold discounts/refunds totalling ₹${total.toLocaleString('en-IN')}.`,
            chain,
            recommendedActions: RECOMMENDED_ACTIONS.COMPOUNDING_MICRO_LEAK,
            status: 'open',
        });
    }
    return out;
}

/**
 * Runs every hidden-leakage detector and attaches a root-cause chain to
 * each finding, replacing any existing 'open' hidden leaks.
 */
async function runHiddenLeakageDetection() {
    const [transactions, payments, customers, openLeaks] = await Promise.all([
        Transaction.find(),
        Payment.find(),
        Customer.find(),
        RevenueLeak.find({ status: 'open' }),
    ]);

    const now = new Date();
    const found = [
        ...detectSilentDowngrades(customers, transactions, payments, openLeaks, now),
        ...detectDormantBilling(customers, transactions, payments, openLeaks, now),
        ...detectOrphanedCollections(customers, transactions, payments, openLeaks, now),
        ...detectCompoundingMicroLeaks(customers, transactions, payments, openLeaks, now),
    ].sort((a, b) => b.riskScore - a.riskScore);

    await HiddenLeak.deleteMany({ status: 'open' });
    if (found.length) await HiddenLeak.insertMany(found);

    return { created: found.length };
}

async function getHiddenLeakageSummary() {
    const leaks = await HiddenLeak.find({ status: 'open' }).lean();

    const byType = {};
    let totalHidden = 0;
    for (const l of leaks) {
        byType[l.type] = (byType[l.type] || 0) + 1;
        totalHidden += l.amountAtRisk || 0;
    }

    const overallScore = leaks.length
        ? clamp(Math.round(leaks.reduce((sum, l) => sum + l.riskScore, 0) / leaks.length), 0, 100)
        : 0;

    return {
        hiddenLeakageScore: overallScore,
        openHiddenLeakCount: leaks.length,
        totalHidden: round2(totalHidden),
        byType,
    };
}

module.exports = {
    runHiddenLeakageDetection,
    getHiddenLeakageSummary,
    HIDDEN_LEAK_TYPES: HiddenLeak.HIDDEN_LEAK_TYPES,
};
