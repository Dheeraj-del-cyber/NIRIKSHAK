import React, { useCallback, useEffect, useState } from 'react';
import { Container, Stack, Typography, Grid, Alert } from '@mui/material';
import RevenueUploadPanel from '../components/revenue/RevenueUploadPanel';
import RevenueRiskCards from '../components/revenue/RevenueRiskCards';
import LeakageChart from '../components/revenue/LeakageChart';
import LeakageTable from '../components/revenue/LeakageTable';
import ChurnRiskTable from '../components/revenue/ChurnRiskTable';
import { getRevenueSummary, getRevenueLeaks } from '../api/revenueClient';

export default function RevenueRiskPage() {
    const [summary, setSummary] = useState(null);
    const [leaks, setLeaks] = useState([]);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const [summaryRes, leaksRes] = await Promise.all([
                getRevenueSummary(),
                getRevenueLeaks({ status: 'open' }),
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
                    Revenue Leakage &amp; Risk
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Detect unusual discounts/refunds, overdue payments and failed renewals, predict churn, and get
                    a revenue-risk score with explanations, recoverable-revenue estimates and recommended actions —
                    all in one place.
                </Typography>
            </Stack>

            <Stack spacing={4}>
                {error && <Alert severity="error">{error}</Alert>}

                <RevenueUploadPanel onAnalysisComplete={load} />

                <RevenueRiskCards summary={summary} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <LeakageChart byType={summary?.byType} />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <LeakageTable leaks={leaks} />
                    </Grid>
                </Grid>

                <ChurnRiskTable churnRisks={summary?.churnRisks} />
            </Stack>
        </Container>
    );
}