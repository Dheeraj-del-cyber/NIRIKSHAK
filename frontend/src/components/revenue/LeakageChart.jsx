import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LABELS = {
    UNUSUAL_DISCOUNT: 'Unusual Discount',
    UNUSUAL_REFUND: 'Unusual Refund',
    OVERDUE_PAYMENT: 'Overdue Payment',
    FAILED_RENEWAL: 'Failed Renewal',
    CHURN_RISK: 'Churn Risk',
};

const COLORS = ['#E36414', '#C1121F', '#0F4C5C', '#8E44AD', '#E9C46A'];

export default function LeakageChart({ byType }) {
    const data = Object.entries(byType || {}).map(([type, count]) => ({
        name: LABELS[type] || type,
        value: count,
    }));

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Leakage by Type
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">Upload data and run analysis to see results.</Typography>
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={95}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}