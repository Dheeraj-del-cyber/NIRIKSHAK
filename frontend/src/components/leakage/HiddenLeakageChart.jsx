import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LABELS = {
    SILENT_DOWNGRADE: 'Silent Downgrade',
    DORMANT_BILLING: 'Dormant Billing',
    ORPHANED_COLLECTION: 'Orphaned Collection',
    COMPOUNDING_MICRO_LEAK: 'Compounding Micro-Leak',
};

const COLORS = ['#8E44AD', '#0F4C5C', '#C1121F', '#E9C46A'];

export default function HiddenLeakageChart({ byType }) {
    const data = Object.entries(byType || {}).map(([type, count]) => ({
        name: LABELS[type] || type,
        value: count,
    }));

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Hidden Leaks by Type
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the scan to see results.</Typography>
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
