import React, { useCallback, useEffect, useState } from 'react';
import { Container, Stack, Typography, Grid, Alert } from '@mui/material';
import LeakageRunPanel from '../components/leakage/LeakageRunPanel';
import HiddenLeakageCards from '../components/leakage/HiddenLeakageCards';
import HiddenLeakageChart from '../components/leakage/HiddenLeakageChart';
import HiddenLeakChainTable from '../components/leakage/HiddenLeakChainTable';
import { getHiddenLeakageSummary, getHiddenLeaks } from '../api/leakageClient';

export default function HiddenLeakagePage() {
    const [summary, setSummary] = useState(null);
    const [leaks, setLeaks] = useState([]);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const [summaryRes, leaksRes] = await Promise.all([
                getHiddenLeakageSummary(),
                getHiddenLeaks({ status: 'open' }),
            ]);
            setSummary(summaryRes.data);
            setLeaks(leaksRes.data);
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
                    Hidden Leakage &amp; Chain Detection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Leaks that don't trip a single loud threshold, found by connecting weak signals across your
                    transaction, payment, and customer data — each one comes with the root-cause trail behind it.
                </Typography>
            </Stack>

            <Stack spacing={4}>
                {error && <Alert severity="error">{error}</Alert>}

                <LeakageRunPanel onRunComplete={load} />

                <HiddenLeakageCards summary={summary} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <HiddenLeakageChart byType={summary?.byType} />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <HiddenLeakChainTable leaks={leaks} />
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}
