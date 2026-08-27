const express = require('express');
const RecoveryWorkflow = require('../models/RecoveryWorkflow');
const {
    runRecoverySimulation,
    runAutonomousRecoveryAgent,
    getRecoverySummary,
    updateWorkflowStatus,
} = require('../services/recoveryEngine');

const router = express.Router();

// POST /api/recovery/simulate - Recovery Simulator: projects an outcome for
// every open leak without creating or touching any workflow.
router.post('/simulate', async (req, res) => {
    try {
        const result = await runRecoverySimulation();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/recovery/run - Autonomous Recovery Agent: simulates first, then
// auto-creates a workflow for anything at/above the success-probability
// threshold and queues the rest for review.
router.post('/run', async (req, res) => {
    try {
        const result = await runAutonomousRecoveryAgent();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/recovery/summary - autonomy score, projected/expected/recovered
// totals, breakdown by leak type.
router.get('/summary', async (req, res) => {
    try {
        res.json(await getRecoverySummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/recovery/workflows?decision=&status=&leakType= - current workflows
router.get('/workflows', async (req, res) => {
    try {
        const filter = {};
        if (req.query.decision) filter.decision = req.query.decision;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.leakType) filter.leakType = req.query.leakType;
        const workflows = await RecoveryWorkflow.find(filter).sort({ successProbability: -1 });
        res.json(workflows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/recovery/workflows/:id/status - move a workflow along
// (in_progress -> recovered/failed/cancelled), e.g. after a human reviews
// and approves a pending_review workflow.
router.patch('/workflows/:id/status', async (req, res) => {
    try {
        const workflow = await updateWorkflowStatus(req.params.id, req.body.status);
        res.json(workflow);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
});

module.exports = router;
