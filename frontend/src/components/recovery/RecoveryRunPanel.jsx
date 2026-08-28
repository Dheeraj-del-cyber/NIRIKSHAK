import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import HubIcon from '@mui/icons-material/Hub';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VerifiedIcon from '@mui/icons-material/Verified';
import { simulateRecovery, runAutonomousRecoveryAgent } from '../../api/recoveryClient';

const DEMO_SCENARIOS = [
  { label: 'Q2 Open Leaks', leaks: 37, autoInitiate: 22, pendingReview: 15, recoverable: '₹18,40,000' },
  { label: 'Subscription Arrears', leaks: 18, autoInitiate: 11, pendingReview: 7, recoverable: '₹7,25,000' },
  { label: 'Enterprise Disputes', leaks: 21, autoInitiate: 9, pendingReview: 12, recoverable: '₹28,70,000' },
];

const SIM_STEPS = [
  { label: 'Loading open leak inventory' },
  { label: 'Scoring recovery probability per leak' },
  { label: 'Projecting recoverable amounts' },
  { label: 'Simulation preview ready (no actions yet)' },
];

const AGENT_STEPS = [
  { label: 'Running recovery simulation' },
  { label: 'Auto-initiating high-confidence workflows' },
  { label: 'Queuing borderline cases for review' },
  { label: 'Notifying stakeholders via channels' },
  { label: 'Recovery agent run complete' },
];

export default function RecoveryRunPanel({ onAgentRunComplete, autoRecoveryThreshold }) {
  const [simulating, setSimulating] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoMode, setDemoMode] = useState('simulate'); // 'simulate' | 'agent'
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(0);
  const scenario = DEMO_SCENARIOS[scenarioIndex % DEMO_SCENARIOS.length];

  const runPipeline = async (steps) => {
    setPipelineStep(0);
    for (let i = 1; i <= steps.length; i++) {
      await new Promise((r) => setTimeout(r, 560));
      setPipelineStep(i);
    }
  };

  const handleSimulate = async () => {
    setError(null);
    setSimulating(true);
    setDemoMode('simulate');
    setShowDemo(true);
    await runPipeline(SIM_STEPS);
    try {
      const res = await simulateRecovery();
      setPreview(res.data);
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setShowDemo(false);
      setSimulating(false);
      setPipelineStep(0);
    }
  };

  const handleRunAgent = async () => {
    setError(null);
    setRunning(true);
    setDemoMode('agent');
    setShowDemo(true);
    await runPipeline(AGENT_STEPS);
    try {
      await runAutonomousRecoveryAgent();
      setPreview(null);
      setScenarioIndex((idx) => idx + 1);
      await new Promise((r) => setTimeout(r, 300));
      onAgentRunComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setShowDemo(false);
      setRunning(false);
      setPipelineStep(0);
    }
  };

  const steps = demoMode === 'simulate' ? SIM_STEPS : AGENT_STEPS;
  const activeColor = demoMode === 'simulate' ? 'warning' : 'success';

  const autoCount = preview?.simulations?.filter((s) => s.decision === 'auto_initiated').length ?? 0;
  const reviewCount = (preview?.simulated ?? 0) - autoCount;

  return (
    <Card
      variant="outlined"
      sx={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(245,158,11,0.03) 100%)' }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <PsychologyIcon color="success" /> Recovery Engine &amp; Autonomous Agent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Simulates recovery odds, then self-initiates workflows for high-confidence leaks at or above the{' '}
              {typeof autoRecoveryThreshold === 'number' ? `${autoRecoveryThreshold}%` : 'configured'} threshold
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip icon={<HubIcon />} label="Leaks: Indexed" color="success" size="small" sx={{ fontWeight: 600 }} />
            <Chip icon={<VerifiedIcon />} label="Agent: Standby" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Status tiles */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Open leak inventory', status: 'Loaded', color: 'success.main' },
            { label: 'Probability model', status: 'Calibrated', color: 'success.main' },
            { label: 'Workflow engine', status: 'Ready', color: 'success.main' },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                flex: 1, p: 1.5, border: '1px solid', borderColor: 'divider',
                borderRadius: 2, bgcolor: 'background.paper', textAlign: 'center',
              }}
            >
              <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
              <Chip
                label={item.status}
                size="small"
                sx={{ mt: 0.5, bgcolor: item.color, color: '#fff', fontSize: '0.65rem', fontWeight: 700, height: 18, '& .MuiChip-label': { px: 0.75 } }}
              />
            </Box>
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Batch preview */}
        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
            <FlashOnIcon fontSize="inherit" /> CURRENT BATCH: {scenario.label.toUpperCase()}
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            {[
              ['Open leaks', scenario.leaks],
              ['Would auto-initiate', scenario.autoInitiate],
              ['Pending review', scenario.pendingReview],
              ['Recoverable est.', scenario.recoverable],
            ].map(([k, v]) => (
              <Box key={k}>
                <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                <Typography variant="body2" fontWeight={700}>{v}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Action buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ScienceIcon />}
            onClick={handleSimulate}
            disabled={simulating || running}
            sx={{ fontWeight: 600 }}
          >
            {simulating ? 'Simulating…' : 'Simulate Only (preview)'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<BoltIcon />}
            onClick={handleRunAgent}
            disabled={running || simulating}
            sx={{ fontWeight: 700 }}
          >
            {running ? 'Agent working…' : 'Run Autonomous Agent'}
          </Button>
        </Stack>

        {/* Simulation preview results */}
        {preview && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Simulation preview (not yet acted on)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${preview.simulated} leaks simulated`} size="small" />
              <Chip label={`${autoCount} would auto-initiate`} color="success" size="small" />
              <Chip label={`${reviewCount} would need review`} color="warning" size="small" />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Nothing has been created yet — run the Autonomous Agent to persist these as workflows.
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Animated pipeline dialog */}
      <Dialog open={showDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 700 }}>
          {demoMode === 'simulate' ? 'Running Recovery Simulation' : 'Autonomous Recovery Agent'}
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2.5, border: '1px dashed', borderColor: demoMode === 'agent' ? 'success.main' : 'warning.main' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              BATCH: {scenario.label.toUpperCase()}
            </Typography>
            {[
              ['Open leaks', scenario.leaks],
              ['Auto-initiate threshold', typeof autoRecoveryThreshold === 'number' ? `${autoRecoveryThreshold}%` : 'Default'],
              ['Estimated recoverable', scenario.recoverable],
            ].map(([k, v]) => (
              <Box key={k} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">{k}:</Typography>
                <Typography variant="body2" fontWeight={600}>{v}</Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={1}>
            {steps.map((step, i) => {
              const done = pipelineStep > i;
              const active = pipelineStep === i && (simulating || running);
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1,
                    bgcolor: done ? 'success.light' : active ? `${activeColor}.light` : 'background.default',
                    opacity: pipelineStep < i ? 0.35 : 1,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {done ? <CheckCircleIcon fontSize="small" color="success" />
                    : active ? <CircularProgress size={16} thickness={5} color={activeColor} />
                      : <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'action.disabled' }} />}
                  <Typography variant="body2" fontWeight={done || active ? 600 : 400}>{step.label}</Typography>
                </Box>
              );
            })}
          </Stack>

          {pipelineStep > 0 && (
            <LinearProgress
              variant="determinate"
              value={(pipelineStep / steps.length) * 100}
              color={activeColor}
              sx={{ mt: 2, borderRadius: 4, height: 6 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
