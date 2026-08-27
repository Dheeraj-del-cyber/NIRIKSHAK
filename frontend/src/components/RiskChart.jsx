import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LABELS = {
  MISSING_IN_GSTR: 'Missing in GSTR-2B',
  MISSING_INVOICE: 'Missing Invoice',
  AMOUNT_MISMATCH: 'Amount Mismatch',
  DUPLICATE_INVOICE: 'Duplicate Invoice',
  DELAYED_FILING: 'Delayed Filing',
};

const COLORS = ['#0F4C5C', '#E36414', '#C1121F', '#2A9D8F', '#E9C46A'];

export default function RiskChart({ byType }) {
  const data = Object.entries(byType || {}).map(([type, count]) => ({
    name: LABELS[type] || type,
    value: count,
  }));

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Mismatches by Type
        </Typography>
        {data.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No mismatches yet — upload data and run analysis.
            </Typography>
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
