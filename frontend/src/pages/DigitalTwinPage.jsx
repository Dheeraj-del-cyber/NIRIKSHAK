import React, { useCallback, useEffect, useState } from 'react';
import { Container, Stack, Typography, Grid, Alert } from '@mui/material';
import TwinRunPanel from '../components/twin/TwinRunPanel';
import TwinSummaryCards from '../components/twin/TwinSummaryCards';
import TwinGapChart from '../components/twin/TwinGapChart';
import TwinGapTable from '../components/twin/TwinGapTable';
import { getTwinSummary, getTwinSnapshots } from '../api/twinClient';

export default function DigitalTwinPage() {
    const [summary, setSummary] = useState(null);
    const [snapshots, setSnapshots] = useState([]);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const [summaryRes, snapshotsRes] = await Promise.all([getTwinSummary(), getTwinSnapshots()]);
            setSummary(summaryRes.data);
            setSnapshots(snapshotsRes.data);
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
                    Digital Twin &amp; Expected-Revenue Engine
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    A per-customer model of what revenue should have looked like — run-rate and billed amounts vs.
                    what was actually collected — so every gap traces back to numbers you can verify.
                </Typography>
            </Stack>

            <Stack spacing={4}>
                {error && <Alert severity="error">{error}</Alert>}

                <TwinRunPanel onRunComplete={load} />

                <TwinSummaryCards summary={summary} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <TwinGapChart topGaps={summary?.topGaps} />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <TwinGapTable snapshots={snapshots} />
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}
