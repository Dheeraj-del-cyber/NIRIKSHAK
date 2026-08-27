const express = require('express');
const HiddenLeak = require('../models/HiddenLeak');
const { runHiddenLeakageDetection, getHiddenLeakageSummary } = require('../services/leakageDetector');

const router = express.Router();

// POST /api/leakage/run - runs every hidden-leakage detector and attaches a
// root-cause chain to each finding.
router.post('/run', async (req, res) => {
    try {
        const result = await runHiddenLeakageDetection();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/leakage/summary - hidden-leakage score, totals, breakdown by type
router.get('/summary', async (req, res) => {
    try {
        res.json(await getHiddenLeakageSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/leakage/hidden?type=&status= - hidden leaks with their chain trail
router.get('/hidden', async (req, res) => {
    try {
        const filter = { status: req.query.status || 'open' };
        if (req.query.type) filter.type = req.query.type;
        const leaks = await HiddenLeak.find(filter).sort({ riskScore: -1 });
        res.json(leaks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
