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
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { uploadInvoiceFile, uploadGstFile, runAnalysis } from '../api/client';

function UploadRow({ icon, label, onFile, result }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      {icon}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" fontWeight={600}>
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
      <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
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

export default function UploadPanel({ onAnalysisComplete }) {
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

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          1. Data Acquisition &amp; Validation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Upload billing-system invoices and GSTR-2B records (CSV). Each file is checked by the
          validation layer for GSTIN format, numeric integrity, and tax computation consistency
          before it reaches the reconciliation engine.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <UploadRow
          icon={<ReceiptLongIcon color="primary" />}
          label="Billing system invoices"
          onFile={handleInvoiceFile}
          result={invoiceResult}
        />
        <Divider />
        <UploadRow
          icon={<AccountBalanceIcon color="primary" />}
          label="GSTR-2B records"
          onFile={handleGstFile}
          result={gstResult}
        />

        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={handleRun}
            disabled={running}
          >
            {running ? 'Running reconciliation...' : 'Run Analysis'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
