import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert, Stack, Chip, Divider } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import BoltIcon from '@mui/icons-material/Bolt';
import { simulateRecovery, runAutonomousRecoveryAgent } from '../../api/recoveryClient';

export default function RecoveryRunPanel({ onAgentRunComplete, autoRecoveryThreshold }) {
    const [simulating, setSimulating] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleSimulate = async () => {
        setError(null);
        setSimulating(true);
        try {
            const res = await simulateRecovery();
            setPreview(res.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSimulating(false);
        }
    };

    const handleRunAgent = async () => {
        setError(null);
        setRunning(true);
        try {
            await runAutonomousRecoveryAgent();
            setPreview(null);
            onAgentRunComplete?.();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setRunning(false);
        }
    };

    const autoCount = preview?.simulations?.filter((s) => s.decision === 'auto_initiated').length ?? 0;
    const reviewCount = (preview?.simulated ?? 0) - autoCount;

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Recovery Simulator &amp; Autonomous Recovery Agent
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The simulator projects a success probability and recoverable amount for every open leak
                    without touching anything. The agent runs that same simulation, then self-initiates a
                    workflow for anything at or above the{' '}
                    {typeof autoRecoveryThreshold === 'number' ? `${autoRecoveryThreshold}%` : 'configured'}{' '}
                    success-probability threshold — everything else is queued as pending review.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<ScienceIcon />} onClick={handleSimulate} disabled={simulating}>
                        {simulating ? 'Simulating...' : 'Simulate Only (preview)'}
                    </Button>
                    <Button variant="contained" color="secondary" startIcon={<BoltIcon />} onClick={handleRunAgent} disabled={running}>
                        {running ? 'Agent working...' : 'Run Autonomous Agent'}
                    </Button>
                </Stack>

                {preview && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            Simulation preview (not yet acted on)
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${preview.simulated} leaks simulated`} size="small" />
                            <Chip label={`${autoCount} would auto-initiate`} color="success" size="small" />
                            <Chip label={`${reviewCount} would need review`} color="warning" size="small" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Nothing has been created yet — run the Autonomous Agent to persist these as workflows.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
