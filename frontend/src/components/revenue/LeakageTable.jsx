import React, { useState } from 'react';
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
    IconButton,
    Collapse,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const TYPE_LABELS = {
    UNUSUAL_DISCOUNT: 'Unusual Discount',
    UNUSUAL_REFUND: 'Unusual Refund',
    OVERDUE_PAYMENT: 'Overdue Payment',
    FAILED_RENEWAL: 'Failed Renewal',
    CHURN_RISK: 'Churn Risk',
};

function riskColor(score) {
    if (score >= 65) return 'error';
    if (score >= 40) return 'warning';
    return 'default';
}

function LeakRow({ leak }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow hover>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen((o) => !o)}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip size="small" label={TYPE_LABELS[leak.type] || leak.type} />
                </TableCell>
                <TableCell>{leak.customerName || leak.customerId || '—'}</TableCell>
                <TableCell>
                    <Chip size="small" color={riskColor(leak.riskScore)} label={leak.riskScore} />
                </TableCell>
                <TableCell>₹{Number(leak.amountAtRisk || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>₹{Number(leak.recoverableEstimate || 0).toLocaleString('en-IN')}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 5, pr: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Why this was flagged
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                {leak.details}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom>
                                Recommended actions
                            </Typography>
                            <List dense disablePadding>
                                {(leak.recommendedActions || []).map((action, i) => (
                                    <ListItem key={i} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <LightbulbIcon fontSize="small" color="warning" />
                                        </ListItemIcon>
                                        <ListItemText primary={action} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function LeakageTable({ leaks }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Flagged Revenue Leakage
                </Typography>
                {leaks.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">Nothing flagged yet.</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Type</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Risk</TableCell>
                                <TableCell>Amount at Risk</TableCell>
                                <TableCell>Recoverable (est.)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaks.map((leak) => (
                                <LeakRow key={leak._id} leak={leak} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}