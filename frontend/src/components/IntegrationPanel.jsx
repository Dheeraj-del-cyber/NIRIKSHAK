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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PowerIcon from '@mui/icons-material/Power';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { uploadInvoiceFile, uploadGstFile, runAnalysis, simulateInvoice } from '../api/client';

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
    setError(null);
    setRunning(true);
    try {
      await simulateInvoice();
      onAnalysisComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setRunning(false);
    }
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
    </Card>
  );
}
