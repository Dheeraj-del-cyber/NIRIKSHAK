import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { runDigitalTwin } from '../../api/twinClient';

export default function TwinRunPanel({ onRunComplete }) {
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);

    const handleRun = async () => {
        setError(null);
        setRunning(true);
        try {
            await runDigitalTwin();
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
                    Build / Refresh the Digital Twin
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Uses the transaction, payment, and customer data already uploaded on the Revenue Leakage &amp;
                    Risk page. For each customer, the twin models what they should have earned this period — their
                    own run-rate, or what they were actually billed, whichever is higher — and compares it against
                    what was actually collected.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ textAlign: 'right' }}>
                    <Button variant="contained" color="secondary" startIcon={<PlayArrowIcon />} onClick={handleRun} disabled={running}>
                        {running ? 'Modeling the twin...' : 'Run Digital Twin'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
