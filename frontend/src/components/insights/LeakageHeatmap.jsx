import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Tooltip } from '@mui/material';

const TYPE_LABELS = {
    UNUSUAL_DISCOUNT: 'Unusual Discount',
    UNUSUAL_REFUND: 'Unusual Refund',
    OVERDUE_PAYMENT: 'Overdue Payment',
    FAILED_RENEWAL: 'Failed Renewal',
    CHURN_RISK: 'Churn Risk',
    SILENT_DOWNGRADE: 'Silent Downgrade',
    DORMANT_BILLING: 'Dormant Billing',
    ORPHANED_COLLECTION: 'Orphaned Collection',
    COMPOUNDING_MICRO_LEAK: 'Compounding Micro-Leak',
};

function heatColor(amount, maxAmount) {
    if (!amount || !maxAmount) return 'rgba(193, 18, 31, 0.04)';
    const intensity = Math.min(1, amount / maxAmount);
    // Interpolates from a faint tint to the app's alert red.
    const alpha = 0.08 + intensity * 0.72;
    return `rgba(193, 18, 31, ${alpha.toFixed(2)})`;
}

export default function LeakageHeatmap({ heatmap }) {
    if (!heatmap || !heatmap.types?.length) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Revenue Leakage Heatmap
                    </Typography>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No open leaks to map yet.</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const { types, segments, cells, maxAmount } = heatmap;
    const cellFor = (type, segment) => cells.find((c) => c.type === type && c.segment === segment);

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Revenue Leakage Heatmap
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Where the money is bleeding from — leak type by customer segment, shaded by amount at risk.
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Leak Type</TableCell>
                                {segments.map((seg) => (
                                    <TableCell key={seg} align="center" sx={{ fontWeight: 600 }}>
                                        {seg}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {types.map((type) => (
                                <TableRow key={type}>
                                    <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        {TYPE_LABELS[type] || type}
                                    </TableCell>
                                    {segments.map((seg) => {
                                        const cell = cellFor(type, seg);
                                        const amount = cell?.amount || 0;
                                        const count = cell?.count || 0;
                                        return (
                                            <Tooltip
                                                key={seg}
                                                title={amount > 0 ? `₹${amount.toLocaleString('en-IN')} across ${count} leak(s)` : 'No leaks'}
                                            >
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: heatColor(amount, maxAmount),
                                                        fontWeight: amount > 0 ? 600 : 400,
                                                        color: amount / (maxAmount || 1) > 0.55 ? 'white' : 'text.primary',
                                                        minWidth: 110,
                                                    }}
                                                >
                                                    {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '—'}
                                                </TableCell>
                                            </Tooltip>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </CardContent>
        </Card>
    );
}
