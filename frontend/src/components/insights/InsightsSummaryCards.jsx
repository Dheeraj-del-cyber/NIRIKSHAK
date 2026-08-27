import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const TREND_ICON = {
    rising: <TrendingUpIcon />,
    falling: <TrendingDownIcon />,
    stable: <TrendingFlatIcon />,
};

const TREND_COLOR = {
    rising: 'error',
    falling: 'success',
    stable: 'info',
};

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
                    <Typography variant="h6" noWrap>
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

export default function InsightsSummaryCards({ summary }) {
    if (!summary) return null;
    const trendColor = TREND_COLOR[summary.trend] || 'default';

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Total Open Risk"
                    value={`₹${summary.totalAtRisk?.toLocaleString('en-IN')}`}
                    color="error"
                    sub={`${summary.totalLeaks || 0} open leak(s)`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<WhatshotIcon />}
                    label="Hottest Spot"
                    value={summary.hottestCell ? `₹${summary.hottestCell.amount.toLocaleString('en-IN')}` : '—'}
                    color="warning"
                    sub={summary.hottestCell ? `${summary.hottestCell.type} · ${summary.hottestCell.segment}` : 'No data yet'}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={TREND_ICON[summary.trend] || <TrendingFlatIcon />}
                    label="Leakage Trend"
                    value={(summary.trend || 'unknown').replace('_', ' ')}
                    color={trendColor === 'default' ? 'info' : trendColor}
                    sub={`${summary.growthRatePct ?? 0}% per period`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Next Period Projection"
                    value={summary.nextForecast ? `₹${summary.nextForecast.projected.toLocaleString('en-IN')}` : '—'}
                    color="secondary"
                    sub={summary.nextForecast ? `${summary.nextForecast.period} · ${summary.confidence} confidence` : 'No data yet'}
                />
            </Grid>
        </Grid>
    );
}
