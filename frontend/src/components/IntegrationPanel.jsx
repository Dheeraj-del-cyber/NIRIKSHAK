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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PowerIcon from '@mui/icons-material/Power';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { uploadInvoiceFile, uploadGstFile, runAnalysis, simulateInvoice } from '../api/client';

const DEMO_SCENARIOS = [
  {
    invoiceNo: "INV-10452",
    supplier: "ABC Technologies Pvt Ltd",
    gstin: "29ABCDE1234F1Z5",
    totalValue: 59000,
    totalTax: 9000,
    gstrTax: 8100,
  },
  {
    invoiceNo: "INV-55990",
    supplier: "Global Logistics",
    gstin: "27XYZDE9876G2Z4",
    totalValue: 118000,
    totalTax: 18000,
    gstrTax: 0, // Missing in GSTR completely
  },
  {
    invoiceNo: "INV-88221",
    supplier: "Cloud Hosting Services",
    gstin: "33AABBC1122C1Z1",
    totalValue: 23600,
    totalTax: 3600,
    gstrTax: 1800, // Partial
  }
];

function UploadRow({ icon, label, onFile, result }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      {icon}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
        {result && (
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip size="small" color="success" label={`${result.acceptedCount} accepted`} />
            {result.rejectedCount > 0 && (
              <Chip size="small" color="warning" label={`${result.rejectedCount} rejected`} />
            )}
          </Stack>
        )}
      </Box>
      <Button component="label" size="small" variant="outlined" startIcon={<UploadFileIcon />}>
        Upload CSV
        <input
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        />
      </Button>
    </Stack>
  );
}

export default function IntegrationPanel({ onAnalysisComplete }) {
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [gstResult, setGstResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [showInvoiceDemo, setShowInvoiceDemo] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const currentScenario = DEMO_SCENARIOS[scenarioIndex % DEMO_SCENARIOS.length];

  const handleInvoiceFile = async (file) => {
    setError(null);
    try {
      const { data } = await uploadInvoiceFile(file);
      setInvoiceResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleGstFile = async (file) => {
    setError(null);
    try {
      const { data } = await uploadGstFile(file);
      setGstResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleRun = async () => {
    setError(null);
    setRunning(true);
    try {
      await runAnalysis();
      onAnalysisComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSimulate = async () => {
    setShowInvoiceDemo(true);
    setRunning(true);
    setError(null);
    
    // Fake delay for animation
    setTimeout(async () => {
      try {
        await simulateInvoice(currentScenario);
        setShowInvoiceDemo(false);
        setScenarioIndex(i => i + 1);
        onAnalysisComplete?.();
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setShowInvoiceDemo(false);
      } finally {
        setRunning(false);
      }
    }, 2000);
  };

  return (
    <Card variant="outlined" sx={{ borderColor: 'primary.main', borderWidth: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <PowerIcon color="primary" /> Integration Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Billing System & GSTR-2B API Connectors
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip icon={<AutoModeIcon />} label="Invoice Sync: Active" color="success" size="small" />
            <Chip label="GSTR-2B: Connected" color="success" size="small" variant="outlined" />
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2">Automated Ingestion (Demo)</Typography>
              <Typography variant="caption" color="text.secondary">
                Simulate a new invoice arriving from the billing system, followed by automated reconciliation.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSimulate}
              disabled={running}
            >
              {running ? 'Simulating...' : 'Simulate New Invoice'}
            </Button>
          </Stack>
        </Box>

        <Accordion elevation={0} sx={{ '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" color="text.secondary">Legacy CSV Fallback</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <UploadRow
              icon={<ReceiptLongIcon color="action" />}
              label="Billing system invoices"
              onFile={handleInvoiceFile}
              result={invoiceResult}
            />
            <Divider />
            <UploadRow
              icon={<AccountBalanceIcon color="action" />}
              label="GSTR-2B records"
              onFile={handleGstFile}
              result={gstResult}
            />
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={handleRun}
                disabled={running}
              >
                Run Manual Reconciliation
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>

      <Dialog open={showInvoiceDemo} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          Receiving Invoice
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <CircularProgress size={60} sx={{ mb: 3, mt: 1 }} />
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, textAlign: 'left', border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>INVOICE DETAILS</Typography>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Invoice No:</Typography>
                <Typography variant="body2" fontWeight="bold">{currentScenario.invoiceNo}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Supplier GSTIN:</Typography>
                <Typography variant="body2" fontWeight="bold">{currentScenario.gstin}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Total Value:</Typography>
                <Typography variant="body2" fontWeight="bold">₹{currentScenario.totalValue.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Total Tax:</Typography>
                <Typography variant="body2" fontWeight="bold">₹{currentScenario.totalTax.toLocaleString('en-IN')}</Typography>
              </Box>
            </Stack>
          </Box>
          <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
            Processing Validation & Reconciliation...
          </Typography>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
