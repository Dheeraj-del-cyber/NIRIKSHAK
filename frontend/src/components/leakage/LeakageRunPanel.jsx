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
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import LinkIcon from '@mui/icons-material/Link';
import { runLeakageSimulate } from '../../api/leakageClient';

const DEMO_SCENARIOS = [
  { label: 'Q2 Cross-Signal Scan', signals: 4820, chains: 37, hiddenLeaks: 12, estimate: '₹2,41,000' },
  { label: 'Subscription Under-billing', signals: 2103, chains: 18, hiddenLeaks: 7, estimate: '₹98,500' },
  { label: 'Enterprise Invoice Gaps', signals: 7660, chains: 54, hiddenLeaks: 21, estimate: '₹5,64,000' },
];

const PIPELINE_STEPS = [
  { label: 'Loading transaction signals' },
  { label: 'Mapping payment correlation patterns' },
  { label: 'Cross-referencing customer & invoice data' },
  { label: 'Building leak chain graph' },
  { label: 'Scoring and ranking hidden leaks' },
];

export default function LeakageRunPanel({ onRunComplete }) {
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
      await new Promise((r) => setTimeout(r, 560));
      setPipelineStep(i);
    }

    try {
      const result = await runLeakageSimulate(scenarioIndex);
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
      sx={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(99,102,241,0.03) 100%)' }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <BubbleChartIcon color="error" /> Hidden Leakage Detector
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connects weak signals across transactions, payments &amp; customers to find invisible leaks
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip icon={<HubIcon />} label="Signals: Active" color="success" size="small" sx={{ fontWeight: 600 }} />
            <Chip icon={<LinkIcon />} label="Chain Engine: Ready" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
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
            { label: 'Transaction signals', status: 'Streaming', color: 'success.main' },
            { label: 'Payment patterns', status: 'Indexed', color: 'success.main' },
            { label: 'Leak chain engine', status: 'Online', color: 'success.main' },
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
            borderColor: 'error.main',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <FlashOnIcon color="error" fontSize="small" />
                Automated Cross-Signal Scan (Demo)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scans live-connected data for leaks invisible in any single dataset. No uploads required.
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Next scan: {scenario.label} · {scenario.signals.toLocaleString()} signals
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleRun}
              disabled={running}
              sx={{ minWidth: 220, fontWeight: 700 }}
            >
              {running ? 'Scanning…' : 'Run Hidden-Leakage Scan'}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      <Dialog open={showDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 700 }}>
          Hidden Leakage Scan
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2.5, border: '1px dashed', borderColor: 'error.main' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              SCAN: {scenario.label.toUpperCase()}
            </Typography>
            {[
              ['Signals analysed', scenario.signals.toLocaleString()],
              ['Chain patterns found', scenario.chains],
              ['Hidden leaks detected', scenario.hiddenLeaks],
              ['Estimated recoverable', scenario.estimate],
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
                    bgcolor: done ? 'success.light' : active ? 'error.light' : 'background.default',
                    opacity: pipelineStep < i ? 0.35 : 1,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {done ? <CheckCircleIcon fontSize="small" color="success" />
                    : active ? <CircularProgress size={16} thickness={5} color="error" />
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
              color="error"
              sx={{ mt: 2, borderRadius: 4, height: 6 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
