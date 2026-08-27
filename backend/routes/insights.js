const express = require('express');
const { getLeakageHeatmap, getFutureLeakagePrediction, getInsightsSummary } = require('../services/insights');

const router = express.Router();

// GET /api/insights/heatmap - spatial view: leak type x customer segment
router.get('/heatmap', async (req, res) => {
    try {
        res.json(await getLeakageHeatmap());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/insights/forecast - temporal view: leakage trend + projection
router.get('/forecast', async (req, res) => {
    try {
        res.json(await getFutureLeakagePrediction());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/insights/summary - one-line headline combining both views
router.get('/summary', async (req, res) => {
    try {
        res.json(await getInsightsSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
