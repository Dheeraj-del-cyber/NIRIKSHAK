import React, { useCallback, useEffect, useState } from 'react';
import { Container, Stack, Typography, Grid, Alert, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsSummaryCards from '../components/insights/InsightsSummaryCards';
import LeakageHeatmap from '../components/insights/LeakageHeatmap';
import LeakagePredictionChart from '../components/insights/LeakagePredictionChart';
import { getInsightsSummary, getLeakageHeatmap, getFutureLeakagePrediction } from '../api/insightsClient';

export default function LeakageInsightsPage() {
    const [summary, setSummary] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, heatmapRes, forecastRes] = await Promise.all([
                getInsightsSummary(),
                getLeakageHeatmap(),
                getFutureLeakagePrediction(),
            ]);
            setSummary(summaryRes.data);
            setHeatmap(heatmapRes.data);
            setForecast(forecastRes.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Container maxWidth="lg">
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                <Stack spacing={0.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Leakage Insights
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        The same open leaks, sliced two ways: where they're concentrated across the business
                        right now, and where the total is headed next.
                    </Typography>
                </Stack>
                <Box>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>
            </Stack>

            <Stack spacing={4}>
                {error && <Alert severity="error">{error}</Alert>}

                <InsightsSummaryCards summary={summary} />

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <LeakageHeatmap heatmap={heatmap} />
                    </Grid>
                    <Grid item xs={12}>
                        <LeakagePredictionChart forecast={forecast} />
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}
