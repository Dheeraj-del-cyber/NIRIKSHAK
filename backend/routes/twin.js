const express = require('express');
const ExpectedRevenue = require('../models/ExpectedRevenue');
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

module.exports = router;
