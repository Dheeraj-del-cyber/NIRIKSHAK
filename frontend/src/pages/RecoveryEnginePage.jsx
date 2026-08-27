import React, { useCallback, useEffect, useState } from 'react';
import { Container, Stack, Typography, Grid, Alert } from '@mui/material';
import RecoveryRunPanel from '../components/recovery/RecoveryRunPanel';
import RecoveryCards from '../components/recovery/RecoveryCards';
import RecoveryChart from '../components/recovery/RecoveryChart';
import RecoveryWorkflowTable from '../components/recovery/RecoveryWorkflowTable';
import { getRecoverySummary, getRecoveryWorkflows } from '../api/recoveryClient';

export default function RecoveryEnginePage() {
    const [summary, setSummary] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const [summaryRes, workflowsRes] = await Promise.all([getRecoverySummary(), getRecoveryWorkflows()]);
            setSummary(summaryRes.data);
            setWorkflows(workflowsRes.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Container maxWidth="lg">
            <Stack spacing={0.5} sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Recovery Engine
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Simulates the odds of actually getting each open leak back, then lets an autonomous agent
                    self-initiate recovery workflows for the confident cases while queuing the rest for review.
                </Typography>
            </Stack>

            <Stack spacing={4}>
                {error && <Alert severity="error">{error}</Alert>}

                <RecoveryRunPanel onAgentRunComplete={load} autoRecoveryThreshold={summary?.autoRecoveryThreshold} />

                <RecoveryCards summary={summary} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <RecoveryChart summary={summary} />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <RecoveryWorkflowTable workflows={workflows} onChanged={load} />
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}
