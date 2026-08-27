import React, { useState } from 'react';
import { Container, Stack, Typography } from '@mui/material';
import IntegrationPanel from '../components/IntegrationPanel';
import Dashboard from '../components/Dashboard';

export default function ReconciliationPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <Container maxWidth="lg">
            <Stack spacing={0.5} sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    GST Reconciliation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Billing-system ↔ GSTR-2B integration, adaptive mismatch detection, and the official audit
                    report.
                </Typography>
            </Stack>
            <Stack spacing={4}>
                <IntegrationPanel onAnalysisComplete={() => setRefreshKey((k) => k + 1)} />
                <Dashboard refreshKey={refreshKey} />
            </Stack>
        </Container>
    );
}