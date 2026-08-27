const express = require('express');
const multer = require('multer');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const RevenueLeak = require('../models/RevenueLeak');
const { parseGenericCsvBuffer } = require('../services/parseCsv');
const { runRevenueAnalysis, getSummary } = require('../services/revenueRisk');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

async function readRows(req) {
    if (req.file) return parseGenericCsvBuffer(req.file.buffer);
    if (Array.isArray(req.body.rows)) return req.body.rows;
    throw Object.assign(new Error('Provide a CSV file (field "file") or JSON body { rows: [...] }'), { status: 400 });
}

// POST /api/revenue/transactions/upload
// Columns: transactionNo, customerId, customerName, invoiceNo, transactionDate,
// grossAmount, discountAmount, refundAmount, isRefund, period
router.post('/transactions/upload', upload.single('file'), async (req, res) => {
    try {
        const rows = await readRows(req);
        const docs = rows.map((r) => ({
            transactionNo: r.transactionNo,
            customerId: r.customerId,
            customerName: r.customerName,
            invoiceNo: r.invoiceNo,
            transactionDate: r.transactionDate,
            grossAmount: num(r.grossAmount),
            discountAmount: num(r.discountAmount),
            refundAmount: num(r.refundAmount),
            isRefund: String(r.isRefund).toLowerCase() === 'true' || num(r.refundAmount) > 0,
            period: r.period,
        }));
        const inserted = await Transaction.insertMany(docs);
        res.json({ acceptedCount: inserted.length });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// POST /api/revenue/payments/upload
// Columns: paymentId, customerId, customerName, invoiceNo, amountDue, amountPaid,
// dueDate, paidDate, status (paid|pending|overdue|failed), renewalStatus (renewed|failed_renewal|na)
router.post('/payments/upload', upload.single('file'), async (req, res) => {
    try {
        const rows = await readRows(req);
        const docs = rows.map((r) => ({
            paymentId: r.paymentId,
            customerId: r.customerId,
            customerName: r.customerName,
            invoiceNo: r.invoiceNo,
            amountDue: num(r.amountDue),
            amountPaid: num(r.amountPaid),
            dueDate: r.dueDate,
            paidDate: r.paidDate || null,
            status: r.status || 'pending',
            renewalStatus: r.renewalStatus || 'na',
        }));
        const inserted = await Payment.insertMany(docs);
        res.json({ acceptedCount: inserted.length });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// POST /api/revenue/customers/upload
// Columns: customerId, name, segment, lastPurchaseDate, previousPeriodSpend,
// currentPeriodSpend, supportComplaints, contractEndDate
router.post('/customers/upload', upload.single('file'), async (req, res) => {
    try {
        const rows = await readRows(req);
        const docs = rows.map((r) => ({
            customerId: r.customerId,
            name: r.name,
            segment: r.segment,
            lastPurchaseDate: r.lastPurchaseDate,
            previousPeriodSpend: num(r.previousPeriodSpend),
            currentPeriodSpend: num(r.currentPeriodSpend),
            supportComplaints: num(r.supportComplaints),
            contractEndDate: r.contractEndDate || null,
        }));
        const inserted = await Customer.insertMany(docs);
        res.json({ acceptedCount: inserted.length });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

// POST /api/revenue/run - runs the revenue-risk engine
router.post('/run', async (req, res) => {
    try {
        const result = await runRevenueAnalysis();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/revenue/summary - revenue-risk score, totals, breakdown, top churn risks
router.get('/summary', async (req, res) => {
    try {
        res.json(await getSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/revenue/leaks?type=&status=
router.get('/leaks', async (req, res) => {
    const filter = { status: req.query.status || 'open' };
    if (req.query.type) filter.type = req.query.type;
    const leaks = await RevenueLeak.find(filter).sort({ riskScore: -1 });
    res.json(leaks);
});

router.delete('/reset', async (req, res) => {
    await Promise.all([
        Transaction.deleteMany({}),
        Payment.deleteMany({}),
        Customer.deleteMany({}),
        RevenueLeak.deleteMany({}),
    ]);
    res.json({ ok: true });
});

module.exports = router;