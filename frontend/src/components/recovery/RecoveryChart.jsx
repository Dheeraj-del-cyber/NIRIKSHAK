import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2E7D32', '#ED6C02', '#0F4C5C', '#C1121F'];

export default function RecoveryChart({ summary }) {
    const data = summary
        ? [
              { name: 'Auto-initiated', value: summary.autoInitiatedCount || 0 },
              { name: 'Needs review', value: summary.needsReviewCount || 0 },
              { name: 'Recovered', value: summary.recoveredCount || 0 },
              { name: 'Failed', value: summary.failedCount || 0 },
          ].filter((d) => d.value > 0)
        : [];

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Workflows by Outcome
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the agent to see results.</Typography>
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
