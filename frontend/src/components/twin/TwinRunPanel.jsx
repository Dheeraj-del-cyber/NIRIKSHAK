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
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  CircularProgress,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import HubIcon from '@mui/icons-material/Hub';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TimelineIcon from '@mui/icons-material/Timeline';
import { runTwinSimulate } from '../../api/twinClient';

const DEMO_SCENARIOS = [
  { label: 'Q2 Customer Cohort', customers: 312, expectedRevenue: '₹18,45,000', actual: '₹15,12,000', gapPct: '18.1%' },
  { label: 'SaaS Renewal Batch', customers: 189, expectedRevenue: '₹9,72,000', actual: '₹8,54,000', gapPct: '12.1%' },
  { label: 'Enterprise Accounts', customers: 64, expectedRevenue: '₹54,20,000', actual: '₹48,60,000', gapPct: '10.3%' },
];

const PIPELINE_STEPS = [
  { label: 'Loading transaction & payment history' },
  { label: 'Building per-customer run-rate model' },
  { label: 'Computing expected revenue baselines' },
  { label: 'Comparing billed vs. actually collected' },
  { label: 'Digital twin snapshot saved' },
];

export default function TwinRunPanel({ onRunComplete }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(0);
  const scenario = DEMO_SCENARIOS[scenarioIndex % DEMO_SCENARIOS.length];

  const handleRun = async () => {
    setShowDemo(true);
    setRunning(true);
    setError(null);
    setPipelineStep(0);

    for (let i = 1; i <= PIPELINE_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 580));
      setPipelineStep(i);
    }

    try {
      const result = await runTwinSimulate(scenarioIndex);
      await new Promise((r) => setTimeout(r, 400));
      setShowDemo(false);
      setScenarioIndex((idx) => idx + 1);
      onRunComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setShowDemo(false);
    } finally {
      setRunning(false);
      setPipelineStep(0);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(16,185,129,0.03) 100%)' }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <AccountTreeIcon color="primary" /> Digital Twin Engine
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per-customer model of what revenue <em>should</em> have looked like vs. actual collections
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip icon={<HubIcon />} label="Data: Live" color="success" size="small" sx={{ fontWeight: 600 }} />
            <Chip icon={<TimelineIcon />} label="Model: Ready" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
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
            { label: 'Transaction data', status: 'Connected', color: 'success.main' },
            { label: 'Payment history', status: 'Synced', color: 'success.main' },
            { label: 'Customer profiles', status: 'Loaded', color: 'success.main' },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                flex: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                textAlign: 'center',
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

        {/* Demo trigger */}
        <Box
          sx={{
            bgcolor: 'background.default',
            p: 2.5,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'primary.main',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <FlashOnIcon color="primary" fontSize="small" />
                Automated Twin Build (Demo)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uses live-connected transaction, payment, and customer data. No uploads needed.
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Next model: {scenario.label} · {scenario.customers} customers
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleRun}
              disabled={running}
              sx={{ minWidth: 200, fontWeight: 700 }}
            >
              {running ? 'Modeling…' : 'Run Digital Twin'}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      <Dialog open={showDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 700 }}>
          Building Digital Twin
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2.5, border: '1px dashed', borderColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              MODEL: {scenario.label.toUpperCase()}
            </Typography>
            {[
              ['Customers', scenario.customers],
              ['Expected Revenue', scenario.expectedRevenue],
              ['Actual Collected', scenario.actual],
              ['Revenue Gap', scenario.gapPct],
            ].map(([k, v]) => (
              <Box key={k} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">{k}:</Typography>
                <Typography variant="body2" fontWeight={600}>{v}</Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={1}>
            {PIPELINE_STEPS.map((step, i) => {
              const done = pipelineStep > i;
              const active = pipelineStep === i && running;
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1,
                    bgcolor: done ? 'success.light' : active ? 'primary.light' : 'background.default',
                    opacity: pipelineStep < i ? 0.35 : 1,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {done ? <CheckCircleIcon fontSize="small" color="success" />
                    : active ? <CircularProgress size={16} thickness={5} />
                      : <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'action.disabled' }} />}
                  <Typography variant="body2" fontWeight={done || active ? 600 : 400}>{step.label}</Typography>
                </Box>
              );
            })}
          </Stack>

          {pipelineStep > 0 && (
            <LinearProgress
              variant="determinate"
              value={(pipelineStep / PIPELINE_STEPS.length) * 100}
              sx={{ mt: 2, borderRadius: 4, height: 6 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
