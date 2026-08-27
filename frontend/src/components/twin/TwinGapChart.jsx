import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TwinGapChart({ topGaps }) {
    const data = (topGaps || [])
        .slice(0, 8)
        .map((s) => ({
            name: s.customerName || s.customerId,
            Expected: s.expectedRevenue,
            Actual: s.actualRevenue,
        }));

    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Expected vs. Actual Revenue
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the digital twin to see results.</Typography>
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                            <Legend />
                            <Bar dataKey="Expected" fill="#0F4C5C" />
                            <Bar dataKey="Actual" fill="#E36414" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
