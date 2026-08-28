const express = require('express');
const ExpectedRevenue = require('../models/ExpectedRevenue');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { runDigitalTwin, getTwinSummary } = require('../services/digitalTwin');

const router = express.Router();

// POST /api/twin/run - (re)builds the digital twin over currently loaded
// transactions/payments/customers.
router.post('/run', async (req, res) => {
    try {
        const result = await runDigitalTwin();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/twin/summary - twin health score, totals, top expected-vs-actual gaps
router.get('/summary', async (req, res) => {
    try {
        res.json(await getTwinSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/twin/snapshots?status=leaking - full per-customer twin snapshots
router.get('/snapshots', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const snapshots = await ExpectedRevenue.find(filter).sort({ gap: -1 });
        res.json(snapshots);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/twin/simulate
// Seeds realistic fake customer/transaction/payment data and builds the twin.
// If Revenue demo data already exists from a prior simulate call it reuses it;
// otherwise it seeds its own dataset.
router.post('/simulate', async (req, res) => {
    try {
        const scenarioIndex = req.body?.scenarioIndex ?? 0;
        const now = new Date();
        const pastDate = (days) => new Date(now.getTime() - days * 86400000).toISOString();

        const SCENARIOS = [
            {
                customers: [
                    { customerId: 'C001', name: 'Apex Retail Ltd', segment: 'Enterprise', lastPurchaseDate: pastDate(130), previousPeriodSpend: 120000, currentPeriodSpend: 45000, supportComplaints: 4, contractEndDate: null },
                    { customerId: 'C002', name: 'NovaTech Solutions', segment: 'SMB', lastPurchaseDate: pastDate(25), previousPeriodSpend: 48000, currentPeriodSpend: 52000, supportComplaints: 1, contractEndDate: null },
                    { customerId: 'C003', name: 'BlueOcean Logistics', segment: 'Enterprise', lastPurchaseDate: pastDate(70), previousPeriodSpend: 80000, currentPeriodSpend: 30000, supportComplaints: 3, contractEndDate: null },
                    { customerId: 'C004', name: 'Sunrise Foods Pvt', segment: 'SMB', lastPurchaseDate: pastDate(10), previousPeriodSpend: 22000, currentPeriodSpend: 25000, supportComplaints: 0, contractEndDate: null },
                    { customerId: 'C005', name: 'TechVista Corp', segment: 'Enterprise', lastPurchaseDate: pastDate(200), previousPeriodSpend: 95000, currentPeriodSpend: 12000, supportComplaints: 5, contractEndDate: null },
                ],
                transactions: [
                    { transactionNo: 'TXN-1001', customerId: 'C001', customerName: 'Apex Retail Ltd', invoiceNo: 'INV-2001', transactionDate: pastDate(15), grossAmount: 50000, discountAmount: 20000, refundAmount: 0, isRefund: false, period: '2024-Q2' },
                    { transactionNo: 'TXN-1002', customerId: 'C002', customerName: 'NovaTech Solutions', invoiceNo: 'INV-2002', transactionDate: pastDate(20), grossAmount: 30000, discountAmount: 3000, refundAmount: 0, isRefund: false, period: '2024-Q2' },
                    { transactionNo: 'TXN-1003', customerId: 'C003', customerName: 'BlueOcean Logistics', invoiceNo: 'INV-2003', transactionDate: pastDate(5), grossAmount: 18000, discountAmount: 500, refundAmount: 0, isRefund: false, period: '2024-Q2' },
                    { transactionNo: 'TXN-1004', customerId: 'C003', customerName: 'BlueOcean Logistics', invoiceNo: 'INV-2004', transactionDate: pastDate(12), grossAmount: 18000, discountAmount: 0, refundAmount: 10000, isRefund: true, period: '2024-Q2' },
                    { transactionNo: 'TXN-1005', customerId: 'C003', customerName: 'BlueOcean Logistics', invoiceNo: 'INV-2005', transactionDate: pastDate(30), grossAmount: 18000, discountAmount: 0, refundAmount: 12000, isRefund: true, period: '2024-Q2' },
                    { transactionNo: 'TXN-1006', customerId: 'C003', customerName: 'BlueOcean Logistics', invoiceNo: 'INV-2006', transactionDate: pastDate(45), grossAmount: 18000, discountAmount: 0, refundAmount: 8000, isRefund: true, period: '2024-Q2' },
                    { transactionNo: 'TXN-1007', customerId: 'C004', customerName: 'Sunrise Foods Pvt', invoiceNo: 'INV-2007', transactionDate: pastDate(8), grossAmount: 25000, discountAmount: 2000, refundAmount: 0, isRefund: false, period: '2024-Q2' },
                    { transactionNo: 'TXN-1008', customerId: 'C005', customerName: 'TechVista Corp', invoiceNo: 'INV-2008', transactionDate: pastDate(40), grossAmount: 40000, discountAmount: 15000, refundAmount: 0, isRefund: false, period: '2024-Q2' },
                ],
                payments: [
                    { paymentId: 'PAY-3001', customerId: 'C001', customerName: 'Apex Retail Ltd', invoiceNo: 'INV-2001', amountDue: 50000, amountPaid: 30000, dueDate: pastDate(50), paidDate: pastDate(40), status: 'overdue', renewalStatus: 'na' },
                    { paymentId: 'PAY-3002', customerId: 'C002', customerName: 'NovaTech Solutions', invoiceNo: 'INV-2002', amountDue: 27000, amountPaid: 27000, dueDate: pastDate(10), paidDate: pastDate(8), status: 'paid', renewalStatus: 'renewed' },
                    { paymentId: 'PAY-3003', customerId: 'C003', customerName: 'BlueOcean Logistics', invoiceNo: 'INV-2003', amountDue: 18000, amountPaid: 18000, dueDate: pastDate(3), paidDate: pastDate(2), status: 'paid', renewalStatus: 'na' },
                    { paymentId: 'PAY-3004', customerId: 'C005', customerName: 'TechVista Corp', invoiceNo: 'INV-2008', amountDue: 40000, amountPaid: 0, dueDate: pastDate(60), paidDate: null, status: 'overdue', renewalStatus: 'failed_renewal' },
                ],
            },
            {
                customers: [
                    { customerId: 'D001', name: 'Pinnacle Health', segment: 'Enterprise', lastPurchaseDate: pastDate(90), previousPeriodSpend: 200000, currentPeriodSpend: 80000, supportComplaints: 3, contractEndDate: null },
                    { customerId: 'D002', name: 'GreenPath Energy', segment: 'SMB', lastPurchaseDate: pastDate(15), previousPeriodSpend: 60000, currentPeriodSpend: 64000, supportComplaints: 0, contractEndDate: null },
                    { customerId: 'D003', name: 'Skyline Infra Ltd', segment: 'Enterprise', lastPurchaseDate: pastDate(160), previousPeriodSpend: 150000, currentPeriodSpend: 20000, supportComplaints: 6, contractEndDate: null },
                ],
                transactions: [
                    { transactionNo: 'TXN-2001', customerId: 'D001', customerName: 'Pinnacle Health', invoiceNo: 'INV-3001', transactionDate: pastDate(25), grossAmount: 80000, discountAmount: 32000, refundAmount: 0, isRefund: false, period: '2024-Q3' },
                    { transactionNo: 'TXN-2002', customerId: 'D002', customerName: 'GreenPath Energy', invoiceNo: 'INV-3002', transactionDate: pastDate(10), grossAmount: 64000, discountAmount: 4000, refundAmount: 0, isRefund: false, period: '2024-Q3' },
                    { transactionNo: 'TXN-2003', customerId: 'D003', customerName: 'Skyline Infra Ltd', invoiceNo: 'INV-3003', transactionDate: pastDate(50), grossAmount: 20000, discountAmount: 1000, refundAmount: 0, isRefund: false, period: '2024-Q3' },
                    { transactionNo: 'TXN-2004', customerId: 'D001', customerName: 'Pinnacle Health', invoiceNo: 'INV-3004', transactionDate: pastDate(15), grossAmount: 80000, discountAmount: 0, refundAmount: 50000, isRefund: true, period: '2024-Q3' },
                    { transactionNo: 'TXN-2005', customerId: 'D001', customerName: 'Pinnacle Health', invoiceNo: 'INV-3005', transactionDate: pastDate(30), grossAmount: 80000, discountAmount: 0, refundAmount: 48000, isRefund: true, period: '2024-Q3' },
                    { transactionNo: 'TXN-2006', customerId: 'D001', customerName: 'Pinnacle Health', invoiceNo: 'INV-3006', transactionDate: pastDate(45), grossAmount: 80000, discountAmount: 0, refundAmount: 45000, isRefund: true, period: '2024-Q3' },
                ],
                payments: [
                    { paymentId: 'PAY-4001', customerId: 'D001', customerName: 'Pinnacle Health', invoiceNo: 'INV-3001', amountDue: 80000, amountPaid: 48000, dueDate: pastDate(40), paidDate: pastDate(30), status: 'overdue', renewalStatus: 'na' },
                    { paymentId: 'PAY-4002', customerId: 'D002', customerName: 'GreenPath Energy', invoiceNo: 'INV-3002', amountDue: 60000, amountPaid: 60000, dueDate: pastDate(5), paidDate: pastDate(4), status: 'paid', renewalStatus: 'renewed' },
                    { paymentId: 'PAY-4003', customerId: 'D003', customerName: 'Skyline Infra Ltd', invoiceNo: 'INV-3003', amountDue: 150000, amountPaid: 0, dueDate: pastDate(90), paidDate: null, status: 'overdue', renewalStatus: 'failed_renewal' },
                ],
            },
            {
                customers: [
                    { customerId: 'E001', name: 'MedCore Pharma', segment: 'Enterprise', lastPurchaseDate: pastDate(5), previousPeriodSpend: 300000, currentPeriodSpend: 320000, supportComplaints: 0, contractEndDate: null },
                    { customerId: 'E002', name: 'Coastal Traders', segment: 'SMB', lastPurchaseDate: pastDate(140), previousPeriodSpend: 35000, currentPeriodSpend: 5000, supportComplaints: 4, contractEndDate: null },
                    { customerId: 'E003', name: 'Urban Mobility Ltd', segment: 'Enterprise', lastPurchaseDate: pastDate(80), previousPeriodSpend: 180000, currentPeriodSpend: 50000, supportComplaints: 2, contractEndDate: null },
                ],
                transactions: [
                    { transactionNo: 'TXN-3001', customerId: 'E001', customerName: 'MedCore Pharma', invoiceNo: 'INV-4001', transactionDate: pastDate(4), grossAmount: 320000, discountAmount: 10000, refundAmount: 0, isRefund: false, period: '2024-Q4' },
                    { transactionNo: 'TXN-3002', customerId: 'E002', customerName: 'Coastal Traders', invoiceNo: 'INV-4002', transactionDate: pastDate(8), grossAmount: 5000, discountAmount: 500, refundAmount: 0, isRefund: false, period: '2024-Q4' },
                    { transactionNo: 'TXN-3003', customerId: 'E003', customerName: 'Urban Mobility Ltd', invoiceNo: 'INV-4003', transactionDate: pastDate(20), grossAmount: 50000, discountAmount: 20000, refundAmount: 0, isRefund: false, period: '2024-Q4' },
                    { transactionNo: 'TXN-3004', customerId: 'E002', customerName: 'Coastal Traders', invoiceNo: 'INV-4004', transactionDate: pastDate(35), grossAmount: 5000, discountAmount: 0, refundAmount: 4000, isRefund: true, period: '2024-Q4' },
                    { transactionNo: 'TXN-3005', customerId: 'E002', customerName: 'Coastal Traders', invoiceNo: 'INV-4005', transactionDate: pastDate(60), grossAmount: 5000, discountAmount: 0, refundAmount: 4500, isRefund: true, period: '2024-Q4' },
                    { transactionNo: 'TXN-3006', customerId: 'E002', customerName: 'Coastal Traders', invoiceNo: 'INV-4006', transactionDate: pastDate(90), grossAmount: 5000, discountAmount: 0, refundAmount: 3500, isRefund: true, period: '2024-Q4' },
                ],
                payments: [
                    { paymentId: 'PAY-5001', customerId: 'E001', customerName: 'MedCore Pharma', invoiceNo: 'INV-4001', amountDue: 310000, amountPaid: 310000, dueDate: pastDate(2), paidDate: pastDate(1), status: 'paid', renewalStatus: 'renewed' },
                    { paymentId: 'PAY-5002', customerId: 'E002', customerName: 'Coastal Traders', invoiceNo: 'INV-4002', amountDue: 35000, amountPaid: 0, dueDate: pastDate(100), paidDate: null, status: 'overdue', renewalStatus: 'failed_renewal' },
                    { paymentId: 'PAY-5003', customerId: 'E003', customerName: 'Urban Mobility Ltd', invoiceNo: 'INV-4003', amountDue: 180000, amountPaid: 50000, dueDate: pastDate(55), paidDate: pastDate(50), status: 'overdue', renewalStatus: 'na' },
                ],
            },
        ];

        const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];

        // Only reseed if no existing data — allow chaining with revenue/simulate
        const existingCustomers = await Customer.countDocuments();
        if (existingCustomers === 0) {
            await Promise.all([
                Transaction.insertMany(scenario.transactions),
                Payment.insertMany(scenario.payments),
                Customer.insertMany(scenario.customers),
            ]);
        }

        const result = await runDigitalTwin();
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
