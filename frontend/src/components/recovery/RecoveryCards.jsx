import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

function scoreColor(score) {
    if (score >= 65) return 'success';
    if (score >= 35) return 'warning';
    return 'error';
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

export default function RecoveryCards({ summary }) {
    if (!summary) return null;
    const scoreCol = scoreColor(summary.autonomyScore);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AutoAwesomeIcon color={scoreCol} />
                            <Typography variant="body2" color="text.secondary">
                                Agent Autonomy Score
                            </Typography>
                        </Box>
                        <Typography variant="h4" color={`${scoreCol}.main`} sx={{ fontWeight: 700 }}>
                            {summary.autonomyScore}/100
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={summary.autonomyScore}
                            color={scoreCol}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Total Expected Recovery"
                    value={`₹${summary.totalExpectedRecovery?.toLocaleString('en-IN')}`}
                    color="secondary"
                    sub={`of ₹${summary.totalProjectedRecovery?.toLocaleString('en-IN')} projected`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<TaskAltIcon />}
                    label="Confirmed Recovered"
                    value={`₹${summary.totalRecovered?.toLocaleString('en-IN')}`}
                    color="success"
                    sub={`${summary.recoveredCount || 0} workflow(s) closed out`}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<HourglassTopIcon />}
                    label="Pending Human Review"
                    value={summary.needsReviewCount || 0}
                    color="warning"
                    sub={`${summary.autoInitiatedCount || 0} auto-initiated`}
                />
            </Grid>
        </Grid>
    );
}
