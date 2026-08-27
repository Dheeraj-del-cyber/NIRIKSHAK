import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { runHiddenLeakageDetection } from '../../api/leakageClient';

export default function LeakageRunPanel({ onRunComplete }) {
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);

    const handleRun = async () => {
        setError(null);
        setRunning(true);
        try {
            await runHiddenLeakageDetection();
            onRunComplete?.();
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
                    Scan for Hidden Leakage
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Looks for leaks that don't show up as one loud signal in a single dataset — silent
                    under-billing, invoices that never went out, "paid" invoices that were never fully collected,
                    and small discounts that add up. Every finding comes with a root-cause chain across your
                    transaction, payment, customer, and existing leak data.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ textAlign: 'right' }}>
                    <Button variant="contained" color="secondary" startIcon={<PlayArrowIcon />} onClick={handleRun} disabled={running}>
                        {running ? 'Tracing the chains...' : 'Run Hidden-Leakage Scan'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
