import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Box,
    Tooltip,
} from '@mui/material';

function riskColor(score) {
    if (score >= 65) return 'error';
    if (score >= 40) return 'warning';
    return 'default';
}

export default function ChurnRiskTable({ churnRisks }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Customers Likely to Churn
                </Typography>
                {!churnRisks || churnRisks.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No customers currently flagged as at-risk.</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Customer</TableCell>
                                <TableCell>Churn Score</TableCell>
                                <TableCell>Revenue at Risk</TableCell>
                                <TableCell>Reason</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {churnRisks.map((c) => (
                                <TableRow key={c._id} hover>
                                    <TableCell>{c.customerName || c.customerId}</TableCell>
                                    <TableCell>
                                        <Chip size="small" color={riskColor(c.riskScore)} label={c.riskScore} />
                                    </TableCell>
                                    <TableCell>₹{Number(c.amountAtRisk || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Tooltip title={c.details}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 260 }}>
                                                {c.details}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}