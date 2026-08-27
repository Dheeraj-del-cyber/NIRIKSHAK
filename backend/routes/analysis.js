const express = require('express');
const Mismatch = require('../models/Mismatch');
const PatternWeight = require('../models/PatternWeight');
const { runReconciliation, recordFeedback } = require('../services/adaptiveAI');
const { buildHumanReport, buildMachineXml } = require('../services/report');

const router = express.Router();

// POST /api/analysis/run - triggers the Adaptive AI reconciliation pass
router.post('/run', async (req, res) => {
  try {
    const result = await runReconciliation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/mismatches?status=open&type=AMOUNT_MISMATCH
router.get('/mismatches', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  const mismatches = await Mismatch.find(filter).sort({ riskScore: -1 });
  res.json(mismatches);
});

// POST /api/analysis/mismatches/:id/feedback  { outcome: 'confirmed' | 'false_positive' }
router.post('/mismatches/:id/feedback', async (req, res) => {
  try {
    const { outcome } = req.body;
    const result = await recordFeedback(req.params.id, outcome);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/analysis/summary - dashboard summary (counts, ITC at risk, chart data)
router.get('/summary', async (req, res) => {
  const mismatches = await Mismatch.find().lean();
  const open = mismatches.filter((m) => m.status === 'open');
  const falsePositives = mismatches.filter((m) => m.status === 'false_positive');

  const byType = {};
  for (const m of open) {
    byType[m.type] = (byType[m.type] || 0) + 1;
  }

  const totalItcAtRisk = open.reduce((sum, m) => sum + (m.itcAtRisk || 0), 0);
  const itcProtected = falsePositives.reduce((sum, m) => sum + (m.itcAtRisk || 0), 0);
  const weights = await PatternWeight.find().lean();
  
  // Count how many patterns have been learned (timesConfirmed > 0)
  const patternsLearned = weights.filter(w => w.timesConfirmed > 0).length;

  res.json({
    openCount: open.length,
    totalCount: mismatches.length,
    totalItcAtRisk: Math.round(totalItcAtRisk * 100) / 100,
    itcProtected: Math.round(itcProtected * 100) / 100,
    patternsLearned,
    byType,
    weights,
  });
});

// GET /api/analysis/report/txt - human-readable report
router.get('/report/txt', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await buildHumanReport());
});

// GET /api/analysis/report/xml - machine format for retraining/export
router.get('/report/xml', async (req, res) => {
  const xml = await buildMachineXml();
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

module.exports = router;
