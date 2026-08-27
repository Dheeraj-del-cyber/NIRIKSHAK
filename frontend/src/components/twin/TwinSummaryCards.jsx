import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

function scoreColor(score) {
    if (score < 40) return 'error';
    if (score < 70) return 'warning';
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

export default function TwinSummaryCards({ summary }) {
    if (!summary) return null;
    const scoreCol = scoreColor(summary.twinHealthScore);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SpeedIcon color={scoreCol} />
                            <Typography variant="body2" color="text.secondary">
                                Twin Health Score
                            </Typography>
                        </Box>
                        <Typography variant="h4" color={`${scoreCol}.main`} sx={{ fontWeight: 700 }}>
                            {summary.twinHealthScore}/100
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={summary.twinHealthScore}
                            color={scoreCol}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<TrendingUpIcon />}
                    label="Expected Revenue"
                    value={`₹${summary.totalExpected?.toLocaleString('en-IN')}`}
                    color="info"
                    sub={`${summary.customersModeled} customer(s) modeled`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Actually Realized"
                    value={`₹${summary.totalActual?.toLocaleString('en-IN')}`}
                    color="success"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<ReportProblemIcon />}
                    label="Expected-vs-Actual Gap"
                    value={`₹${summary.totalGap?.toLocaleString('en-IN')}`}
                    color="error"
                    sub={`${summary.leakingCustomerCount} customer(s) leaking`}
                />
            </Grid>
        </Grid>
    );
}
