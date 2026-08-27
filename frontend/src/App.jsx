import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Stack, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadPanel from './components/UploadPanel';
import Dashboard from './components/Dashboard';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <VisibilityIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            NIRIKSHAK
          </Typography>
          <Chip
            size="small"
            label="AI-Powered Revenue Leakage Detection"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <UploadPanel onAnalysisComplete={() => setRefreshKey((k) => k + 1)} />
          <Dashboard refreshKey={refreshKey} />
        </Stack>
      </Container>
    </>
  );
}
