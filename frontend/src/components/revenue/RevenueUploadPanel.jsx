import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Stack, Chip, Alert, Box, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import GroupIcon from '@mui/icons-material/Group';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { uploadTransactions, uploadPayments, uploadCustomers, runRevenueAnalysis } from '../../api/revenueClient';

function UploadRow({ icon, label, helper, onFile, result }) {
    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
            {icon}
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {helper}
                </Typography>
                {result && (
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip size="small" color="success" label={`${result.acceptedCount} accepted`} />
                    </Stack>
                )}
            </Box>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                Upload CSV
                <input type="file" accept=".csv" hidden onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
            </Button>
        </Stack>
    );
}

export default function RevenueUploadPanel({ onAnalysisComplete }) {
    const [txnResult, setTxnResult] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [customerResult, setCustomerResult] = useState(null);
    const [error, setError] = useState(null);
    const [running, setRunning] = useState(false);

    const wrap = (setter) => async (file) => {
        setError(null);
        try {
            const { data } = await (setter === setTxnResult
                ? uploadTransactions(file)
                : setter === setPaymentResult
                    ? uploadPayments(file)
                    : uploadCustomers(file));
            setter(data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleRun = async () => {
        setError(null);
        setRunning(true);
        try {
            await runRevenueAnalysis();
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
                    Transaction, Payment &amp; Customer Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Upload sales/refund transactions, payment &amp; renewal records, and customer profiles. The
                    engine analyzes them together to surface leakage and churn risk.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <UploadRow
                    icon={<ReceiptIcon color="primary" />}
                    label="Transactions (sales, discounts, refunds)"
                    helper="transactionNo, customerId, grossAmount, discountAmount, refundAmount, isRefund"
                    onFile={wrap(setTxnResult)}
                    result={txnResult}
                />
                <Divider />
                <UploadRow
                    icon={<PaymentsIcon color="primary" />}
                    label="Payments &amp; renewals"
                    helper="paymentId, customerId, amountDue, amountPaid, dueDate, status, renewalStatus"
                    onFile={wrap(setPaymentResult)}
                    result={paymentResult}
                />
                <Divider />
                <UploadRow
                    icon={<GroupIcon color="primary" />}
                    label="Customer profiles"
                    helper="customerId, name, lastPurchaseDate, previousPeriodSpend, currentPeriodSpend, supportComplaints"
                    onFile={wrap(setCustomerResult)}
                    result={customerResult}
                />

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleRun}
                        disabled={running}
                    >
                        {running ? 'Analyzing revenue risk...' : 'Run Revenue-Risk Analysis'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}