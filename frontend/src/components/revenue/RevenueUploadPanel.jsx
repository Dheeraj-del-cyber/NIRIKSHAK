import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  CircularProgress,
  Divider,
} from '@mui/material';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import GroupIcon from '@mui/icons-material/Group';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HubIcon from '@mui/icons-material/Hub';
import { runRevenueSimulate } from '../../api/revenueClient';

const DEMO_SCENARIOS = [
  {
    label: 'Q2 Sales Cycle',
    transactions: 1248,
    payments: 876,
    customers: 312,
    totalRevenue: '₹18,45,000',
    atRisk: '₹3,12,500',
  },
  {
    label: 'Monthly Subscription Batch',
    transactions: 540,
    payments: 540,
    customers: 189,
    totalRevenue: '₹9,72,000',
    atRisk: '₹86,400',
  },
  {
    label: 'Annual Renewal Sweep',
    transactions: 2103,
    payments: 1987,
    customers: 641,
    totalRevenue: '₹54,20,000',
    atRisk: '₹7,68,000',
  },
];

const PIPELINE_STEPS = [
  { label: 'Transaction records fetched from billing DB', icon: <ReceiptIcon fontSize="small" /> },
  { label: 'Payment & renewal data synced via API', icon: <PaymentsIcon fontSize="small" /> },
  { label: 'Customer profiles loaded from CRM', icon: <GroupIcon fontSize="small" /> },
  { label: 'Cross-signal leakage analysis running', icon: <AutoModeIcon fontSize="small" /> },
  { label: 'Churn risk scores computed', icon: <CheckCircleIcon fontSize="small" /> },
];

export default function RevenueUploadPanel({ onAnalysisComplete }) {
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
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
      await new Promise((r) => setTimeout(r, 550));
      setPipelineStep(i);
    }

    try {
      await runRevenueSimulate(scenarioIndex);
      await new Promise((r) => setTimeout(r, 400));
      setShowDemo(false);
      setScenarioIndex((idx) => idx + 1);
      onAnalysisComplete?.();
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
      sx={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(16,185,129,0.03) 100%)',
      }}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <HubIcon color="secondary" /> Data Integration Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Billing DB, Payment API &amp; CRM — all live-connected
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<AutoModeIcon />} label="CRM: Synced" color="success" size="small" sx={{ fontWeight: 600 }} />
            <Chip icon={<HubIcon />} label="Payment API: Live" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Data source tiles */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { icon: <ReceiptIcon color="primary" />, title: 'Transactions', sub: 'Sales, discounts & refunds', badge: 'AUTO' },
            { icon: <PaymentsIcon color="secondary" />, title: 'Payments & Renewals', sub: 'Due dates, status & arrears', badge: 'AUTO' },
            { icon: <GroupIcon sx={{ color: 'warning.main' }} />, title: 'Customer Profiles', sub: 'Spend, history & support', badge: 'AUTO' },
          ].map((item) => (
            <Box
              key={item.title}
              sx={{
                flex: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'background.paper',
              }}
            >
              {item.icon}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
              </Box>
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  bgcolor: 'success.main',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  height: 18,
                  '& .MuiChip-label': { px: 0.75 },
                }}
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
            borderColor: 'secondary.main',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <FlashOnIcon color="secondary" fontSize="small" />
                Automated Revenue-Risk Analysis (Demo)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Simulate a full data ingestion and cross-signal analysis across transactions, payments, and customers.
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Next batch: {scenario.label} · {scenario.transactions} transactions
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleRun}
              disabled={running}
              sx={{ minWidth: 220, fontWeight: 700 }}
            >
              {running ? 'Analyzing…' : 'Run Revenue-Risk Analysis'}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* Animated pipeline dialog */}
      <Dialog open={showDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 700 }}>
          Revenue Analysis Pipeline
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          {/* Batch summary */}
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2.5, border: '1px dashed', borderColor: 'secondary.main' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              BATCH: {scenario.label.toUpperCase()}
            </Typography>
            {[
              ['Transactions', scenario.transactions],
              ['Payments', scenario.payments],
              ['Customers', scenario.customers],
              ['Total Revenue', scenario.totalRevenue],
              ['Estimated At-Risk', scenario.atRisk],
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: done ? 'success.light' : active ? 'secondary.light' : 'background.default',
                    opacity: pipelineStep < i ? 0.35 : 1,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {done ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : active ? (
                    <CircularProgress size={16} thickness={5} color="secondary" />
                  ) : (
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'action.disabled' }} />
                  )}
                  <Typography variant="body2" fontWeight={done || active ? 600 : 400}>
                    {step.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {pipelineStep > 0 && (
            <LinearProgress
              variant="determinate"
              value={(pipelineStep / PIPELINE_STEPS.length) * 100}
              color="secondary"
              sx={{ mt: 2, borderRadius: 4, height: 6 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}