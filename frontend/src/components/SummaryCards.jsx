import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FactCheckIcon from '@mui/icons-material/FactCheck';

function StatCard({ icon, label, value, color }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: `${color}.light`,
            color: `${color}.dark`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5">{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <StatCard
          icon={<WarningAmberIcon />}
          label="Open Mismatches"
          value={summary.openCount}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          icon={<CurrencyRupeeIcon />}
          label="ITC at Risk"
          value={`₹${summary.totalItcAtRisk?.toLocaleString('en-IN')}`}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard
          icon={<FactCheckIcon />}
          label="Total Reviewed (all-time)"
          value={summary.totalCount}
          color="success"
        />
      </Grid>
    </Grid>
  );
}
