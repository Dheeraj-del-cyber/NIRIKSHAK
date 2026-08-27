// Leakage Insights: Revenue Leakage Heatmap + Future Leakage Prediction.
//
// Both views read the exact same pool of open leaks (loud ones from
// revenueRisk.js, hidden ones from leakageDetector.js) — they just slice it
// along two different axes:
//   - the heatmap is the SPATIAL view: leak type x customer segment, so you
//     can see where the money is bleeding from across the business, not
//     just how much
//   - the prediction is the TEMPORAL view: the same leaks bucketed by the
//     period they actually happened in (pulled from the underlying
//     transaction/payment record each leak points back to), fit to a
//     simple, explainable trend and projected forward
//
// Nothing here is persisted — both views are computed live off whatever
// leaks are currently open, same "no black box" philosophy as the rest of
// the app: every number traces back to a real record.

const RevenueLeak = require('../models/RevenueLeak');
const HiddenLeak = require('../models/HiddenLeak');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

const FORECAST_PERIODS = Number(process.env.FORECAST_PERIODS || 3);

function round2(n) {
    return Math.round((n || 0) * 100) / 100;
}

function monthKey(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthKey(key, offset) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function loadOpenLeaks() {
    const [revenueLeaks, hiddenLeaks] = await Promise.all([
        RevenueLeak.find({ status: 'open' }),
        HiddenLeak.find({ status: 'open' }),
    ]);
    return [
        ...revenueLeaks.map((l) => ({ ...l, sourceType: 'revenue_leak' })),
        ...hiddenLeaks.map((l) => ({ ...l, sourceType: 'hidden_leak' })),
    ];
}

/**
 * SPATIAL VIEW — Revenue Leakage Heatmap: total amount-at-risk and count
 * for every (leak type, customer segment) combination among open leaks.
 */
async function getLeakageHeatmap() {
    const [leaks, customers] = await Promise.all([loadOpenLeaks(), Customer.find()]);
    const segmentByCustomer = new Map(customers.map((c) => [c.customerId, c.segment || 'Unknown']));

    const types = [];
    const segments = [];
    const cellMap = new Map(); // `${type}||${segment}` -> { amount, count }

    for (const leak of leaks) {
        const type = leak.type;
        const segment = segmentByCustomer.get(leak.customerId) || 'Unknown';
        if (!types.includes(type)) types.push(type);
        if (!segments.includes(segment)) segments.push(segment);

        const key = `${type}||${segment}`;
        const cell = cellMap.get(key) || { amount: 0, count: 0 };
        cell.amount += leak.amountAtRisk || 0;
        cell.count += 1;
        cellMap.set(key, cell);
    }

    const cells = [];
    let maxAmount = 0;
    for (const type of types) {
        for (const segment of segments) {
            const cell = cellMap.get(`${type}||${segment}`) || { amount: 0, count: 0 };
            cells.push({ type, segment, amount: round2(cell.amount), count: cell.count });
            if (cell.amount > maxAmount) maxAmount = cell.amount;
        }
    }

    return {
        types,
        segments,
        cells,
        maxAmount: round2(maxAmount),
        totalLeaks: leaks.length,
        totalAtRisk: round2(leaks.reduce((s, l) => s + (l.amountAtRisk || 0), 0)),
    };
}

/**
 * Resolves the period a given leak actually happened in by walking back to
 * the underlying transaction/payment record it points to via refId — the
 * leak's own createdAt is just "when we ran the scan", not when the money
 * actually leaked.
 */
function resolveLeakPeriod(leak, txnByNo, paymentByRef) {
    if (['UNUSUAL_DISCOUNT', 'UNUSUAL_REFUND'].includes(leak.type)) {
        const txn = txnByNo.get(leak.refId);
        if (txn) return txn.period || monthKey(txn.transactionDate);
    }
    if (['OVERDUE_PAYMENT', 'FAILED_RENEWAL'].includes(leak.type)) {
        const payment = paymentByRef.get(leak.refId);
        if (payment) return monthKey(payment.dueDate || payment.paidDate);
    }
    // CHURN_RISK and every hidden-leak type have no single dated source
    // record — fall back to when the scan surfaced them.
    return monthKey(leak.createdAt);
}

/**
 * TEMPORAL VIEW — Future Leakage Prediction: the same open leaks bucketed
 * by period, fit to a simple linear trend and projected forward. With only
 * one period of history the trend degrades gracefully to a flat, low-
 * confidence projection rather than guessing a slope out of thin air.
 */
async function getFutureLeakagePrediction() {
    const [leaks, transactions, payments] = await Promise.all([loadOpenLeaks(), Transaction.find(), Payment.find()]);

    const txnByNo = new Map(transactions.map((t) => [t.transactionNo, t]));
    const paymentByRef = new Map();
    for (const p of payments) {
        if (p.paymentId) paymentByRef.set(p.paymentId, p);
        if (p.invoiceNo) paymentByRef.set(p.invoiceNo, p);
    }

    const byPeriod = new Map();
    for (const leak of leaks) {
        const period = resolveLeakPeriod(leak, txnByNo, paymentByRef);
        if (!period) continue;
        byPeriod.set(period, (byPeriod.get(period) || 0) + (leak.amountAtRisk || 0));
    }

    const history = [...byPeriod.entries()]
        .map(([period, totalAtRisk]) => ({ period, totalAtRisk: round2(totalAtRisk) }))
        .sort((a, b) => (a.period > b.period ? 1 : -1));

    if (history.length === 0) {
        return { history: [], forecast: [], trend: 'no_data', growthRatePct: 0, confidence: 'low' };
    }

    const lastPeriod = history[history.length - 1].period;

    if (history.length === 1) {
        const flatValue = history[0].totalAtRisk;
        const forecast = Array.from({ length: FORECAST_PERIODS }, (_, i) => ({
            period: nextMonthKey(lastPeriod, i + 1),
            projected: flatValue,
        }));
        return {
            history,
            forecast,
            trend: 'insufficient_history',
            growthRatePct: 0,
            confidence: 'low',
            note: 'Only one period of leak data on file — showing a flat projection rather than a trend. Confidence will improve once more periods are available.',
        };
    }

    // Simple least-squares linear fit over period index vs. total at risk.
    const n = history.length;
    const xs = history.map((_, i) => i);
    const ys = history.map((h) => h.totalAtRisk);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;

    const forecast = Array.from({ length: FORECAST_PERIODS }, (_, i) => {
        const x = n + i;
        const projected = Math.max(0, round2(intercept + slope * x));
        return { period: nextMonthKey(lastPeriod, i + 1), projected };
    });

    const lastActual = ys[n - 1] || 0;
    const growthRatePct = lastActual > 0 ? round2((slope / lastActual) * 100) : 0;
    const trend = slope > lastActual * 0.02 ? 'rising' : slope < -lastActual * 0.02 ? 'falling' : 'stable';
    const confidence = n >= 4 ? 'high' : n >= 3 ? 'medium' : 'low';

    return { history, forecast, trend, growthRatePct, confidence };
}

/**
 * Small combined summary for a dashboard header: hottest cell in the
 * heatmap and the forecast headline, so the UI doesn't have to recompute
 * either view just to show a one-line takeaway.
 */
async function getInsightsSummary() {
    const [heatmap, prediction] = await Promise.all([getLeakageHeatmap(), getFutureLeakagePrediction()]);

    const hottestCell = [...heatmap.cells].sort((a, b) => b.amount - a.amount)[0] || null;
    const nextForecast = prediction.forecast[0] || null;

    return {
        totalAtRisk: heatmap.totalAtRisk,
        totalLeaks: heatmap.totalLeaks,
        hottestCell,
        trend: prediction.trend,
        growthRatePct: prediction.growthRatePct,
        nextForecast,
        confidence: prediction.confidence,
    };
}

module.exports = { getLeakageHeatmap, getFutureLeakagePrediction, getInsightsSummary };
