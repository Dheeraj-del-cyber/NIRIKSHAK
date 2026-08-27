import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SavingsIcon from '@mui/icons-material/Savings';
import PersonOffIcon from '@mui/icons-material/PersonOff';

function scoreColor(score) {
    if (score >= 65) return 'error';
    if (score >= 35) return 'warning';
    return 'success';
}

function StatCard({ icon, label, value, color, sub }) {
    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
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
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography variant="h5" noWrap>
                        {value}
                    </Typography>
                    {sub && (
                        <Typography variant="caption" color="text.secondary">
                            {sub}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

export default function RevenueRiskCards({ summary }) {
    if (!summary) return null;
    const scoreCol = scoreColor(summary.revenueRiskScore);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SpeedIcon color={scoreCol} />
                            <Typography variant="body2" color="text.secondary">
                                Revenue Risk Score
                            </Typography>
                        </Box>
                        <Typography variant="h4" color={`${scoreCol}.main`} sx={{ fontWeight: 700 }}>
                            {summary.revenueRiskScore}/100
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={summary.revenueRiskScore}
                            color={scoreCol}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Revenue at Risk"
                    value={`₹${summary.totalAtRisk?.toLocaleString('en-IN')}`}
                    color="error"
                    sub={`${summary.openLeakCount} open item(s)`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<SavingsIcon />}
                    label="Potentially Recoverable"
                    value={`₹${summary.totalRecoverable?.toLocaleString('en-IN')}`}
                    color="success"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<PersonOffIcon />}
                    label="Customers at Churn Risk"
                    value={summary.churnRisks?.length || 0}
                    color="warning"
                />
            </Grid>
        </Grid>
    );
}