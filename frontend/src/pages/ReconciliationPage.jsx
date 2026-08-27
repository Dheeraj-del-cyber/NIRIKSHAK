import React, { useState } from 'react';
import { Container, Stack, Typography } from '@mui/material';
import UploadPanel from '../components/UploadPanel';
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
                    Upload &amp; validate billing invoices against GSTR-2B, then review flagged mismatches.
                </Typography>
            </Stack>
            <Stack spacing={4}>
                <UploadPanel onAnalysisComplete={() => setRefreshKey((k) => k + 1)} />
                <Dashboard refreshKey={refreshKey} />
            </Stack>
        </Container>
    );
}