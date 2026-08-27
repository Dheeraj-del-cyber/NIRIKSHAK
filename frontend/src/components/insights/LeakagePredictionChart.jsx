import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TREND_COLOR = {
    rising: 'error',
    falling: 'success',
    stable: 'default',
    insufficient_history: 'warning',
    no_data: 'default',
};

const TREND_LABEL = {
    rising: 'Rising',
    falling: 'Falling',
    stable: 'Stable',
    insufficient_history: 'Insufficient history',
    no_data: 'No data',
};

export default function LeakagePredictionChart({ forecast }) {
    if (!forecast || (!forecast.history?.length && !forecast.forecast?.length)) {
        return (
            <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Future Leakage Prediction
                    </Typography>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">No open leaks to project yet.</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const history = forecast.history || [];
    const future = forecast.forecast || [];

    // Merge into one series: actual for history periods, projected for
    // future periods, with a bridging point so the dashed projection line
    // connects to the last actual value instead of floating.
    const data = [
        ...history.map((h) => ({ period: h.period, actual: h.totalAtRisk })),
        ...future.map((f, i) => ({
            period: f.period,
            projected: f.projected,
            ...(i === 0 && history.length ? { bridge: history[history.length - 1].totalAtRisk } : {}),
        })),
    ];
    if (future.length && history.length) {
        // give the first forecast point a connecting "actual" value so the
        // solid line meets the dashed line at the same x position
        const bridgeIdx = history.length;
        data[bridgeIdx - 1] = { ...data[bridgeIdx - 1], projected: history[history.length - 1].totalAtRisk };
    }

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6">Future Leakage Prediction</Typography>
                    <Chip size="small" color={TREND_COLOR[forecast.trend] || 'default'} label={TREND_LABEL[forecast.trend] || forecast.trend} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {forecast.note ||
                        `Projected using a simple linear trend across ${history.length} period(s) of leak data (${forecast.confidence} confidence, ${forecast.growthRatePct}% period-over-period growth).`}
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                        <Legend />
                        <Line type="monotone" dataKey="actual" name="Actual" stroke="#0F4C5C" strokeWidth={2} connectNulls />
                        <Line
                            type="monotone"
                            dataKey="projected"
                            name="Projected"
                            stroke="#C1121F"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            connectNulls
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
