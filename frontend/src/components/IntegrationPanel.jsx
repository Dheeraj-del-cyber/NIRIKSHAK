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
  CircularProgress,
  LinearProgress,
  Divider,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerIcon from '@mui/icons-material/Power';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import HubIcon from '@mui/icons-material/Hub';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { simulateInvoice, runAnalysis } from '../api/client';

const DEMO_SCENARIOS = [
  {
    invoiceNo: 'INV-10452',
    supplier: 'ABC Technologies Pvt Ltd',
    gstin: '29ABCDE1234F1Z5',
    totalValue: 59000,
    totalTax: 9000,
    gstrTax: 8100,
  },
  {
    invoiceNo: 'INV-55990',
    supplier: 'Global Logistics',
    gstin: '27XYZDE9876G2Z4',
    totalValue: 118000,
    totalTax: 18000,
    gstrTax: 0,
  },
  {
    invoiceNo: 'INV-88221',
    supplier: 'Cloud Hosting Services',
    gstin: '33AABBC1122C1Z1',
    totalValue: 23600,
    totalTax: 3600,
    gstrTax: 1800,
  },
];

const PIPELINE_STEPS = [
  { label: 'Invoice received from billing system', icon: <ReceiptLongIcon fontSize="small" /> },
  { label: 'GSTR-2B data fetched via API', icon: <AccountBalanceIcon fontSize="small" /> },
  { label: 'AI reconciliation engine triggered', icon: <AutoModeIcon fontSize="small" /> },
  { label: 'Mismatch analysis complete', icon: <CheckCircleIcon fontSize="small" /> },
];

export default function IntegrationPanel({ onAnalysisComplete }) {
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [showInvoiceDemo, setShowInvoiceDemo] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(0);
  const currentScenario = DEMO_SCENARIOS[scenarioIndex % DEMO_SCENARIOS.length];

  const handleSimulate = async () => {
    setShowInvoiceDemo(true);
    setRunning(true);
    setError(null);
    setPipelineStep(0);

    // Animate through pipeline steps
    for (let i = 1; i <= PIPELINE_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setPipelineStep(i);
    }

    try {
      await simulateInvoice(currentScenario);
      await new Promise((r) => setTimeout(r, 400));
      setShowInvoiceDemo(false);
      setScenarioIndex((idx) => idx + 1);
      onAnalysisComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setShowInvoiceDemo(false);
    } finally {
      setRunning(false);
      setPipelineStep(0);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'primary.main',
        borderWidth: 2,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(16,185,129,0.03) 100%)',
      }}
    >
      <CardContent>
        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h6" display="flex" alignItems="center" gap={1} fontWeight={700}>
              <PowerIcon color="primary" /> Integration Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live connections to Billing System &amp; GSTR-2B API
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<AutoModeIcon />}
              label="Invoice Sync: Active"
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              icon={<HubIcon />}
              label="GSTR-2B: Connected"
              color="success"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Live feed indicators */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            {
              icon: <ReceiptLongIcon color="primary" />,
              title: 'Billing System',
              sub: 'Auto-ingesting invoices',
              badge: 'LIVE',
              color: 'success.main',
            },
            {
              icon: <AccountBalanceIcon color="secondary" />,
              title: 'GSTR-2B API',
              sub: 'Streaming tax records',
              badge: 'LIVE',
              color: 'success.main',
            },
            {
              icon: <AutoModeIcon sx={{ color: 'warning.main' }} />,
              title: 'Reconciliation Engine',
              sub: 'Pattern-matching active',
              badge: 'READY',
              color: 'warning.main',
            },
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
                <Typography variant="body2" fontWeight={600}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.sub}
                </Typography>
              </Box>
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  bgcolor: item.color,
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  height: 18,
                  px: 0.5,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Demo simulation panel */}
        <Box
          sx={{
            bgcolor: 'background.default',
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.main',
            borderStyle: 'dashed',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                <FlashOnIcon color="primary" fontSize="small" />
                Automated Ingestion (Demo)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Simulate a new invoice arriving from the billing system, followed by automated
                reconciliation.
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Next: {currentScenario.invoiceNo} · {currentScenario.supplier}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={running ? <SyncIcon sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} /> : <PlayArrowIcon />}
              onClick={handleSimulate}
              disabled={running}
              sx={{ minWidth: 200, fontWeight: 700 }}
            >
              {running ? 'Simulating…' : 'Simulate New Invoice'}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* Animated simulation dialog */}
      <Dialog open={showInvoiceDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 700 }}>
          Automated Ingestion Pipeline
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          {/* Invoice preview card */}
          <Box
            sx={{
              bgcolor: 'background.default',
              p: 2,
              borderRadius: 2,
              mb: 2.5,
              border: '1px dashed',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              INCOMING INVOICE
            </Typography>
            {[
              ['Invoice No', currentScenario.invoiceNo],
              ['Supplier', currentScenario.supplier],
              ['GSTIN', currentScenario.gstin],
              ['Total Value', `₹${currentScenario.totalValue.toLocaleString('en-IN')}`],
              ['Tax (Invoice)', `₹${currentScenario.totalTax.toLocaleString('en-IN')}`],
              ['Tax (GSTR-2B)', currentScenario.gstrTax === 0 ? '— Not found —' : `₹${currentScenario.gstrTax.toLocaleString('en-IN')}`],
            ].map(([k, v]) => (
              <Box key={k} display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">{k}:</Typography>
                <Typography variant="body2" fontWeight={600}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {/* Step-by-step pipeline */}
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
                    bgcolor: done ? 'success.light' : active ? 'primary.light' : 'background.default',
                    opacity: pipelineStep < i ? 0.35 : 1,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {done ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : active ? (
                    <CircularProgress size={16} thickness={5} />
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
              sx={{ mt: 2, borderRadius: 4, height: 6 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
