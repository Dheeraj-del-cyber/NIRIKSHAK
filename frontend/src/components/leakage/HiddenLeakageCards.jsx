import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

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

export default function HiddenLeakageCards({ summary }) {
    if (!summary) return null;
    const scoreCol = scoreColor(summary.hiddenLeakageScore);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <VisibilityOffIcon color={scoreCol} />
                            <Typography variant="body2" color="text.secondary">
                                Hidden-Leakage Score
                            </Typography>
                        </Box>
                        <Typography variant="h4" color={`${scoreCol}.main`} sx={{ fontWeight: 700 }}>
                            {summary.hiddenLeakageScore}/100
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={summary.hiddenLeakageScore}
                            color={scoreCol}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    icon={<CurrencyRupeeIcon />}
                    label="Hidden Revenue at Risk"
                    value={`₹${summary.totalHidden?.toLocaleString('en-IN')}`}
                    color="error"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    icon={<AccountTreeIcon />}
                    label="Open Hidden Leaks"
                    value={summary.openHiddenLeakCount || 0}
                    color="warning"
                />
            </Grid>
        </Grid>
    );
}
