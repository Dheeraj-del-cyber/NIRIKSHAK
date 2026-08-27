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
    Stepper,
    Step,
    StepLabel,
    StepContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const TYPE_LABELS = {
    SILENT_DOWNGRADE: 'Silent Downgrade',
    DORMANT_BILLING: 'Dormant Billing',
    ORPHANED_COLLECTION: 'Orphaned Collection',
    COMPOUNDING_MICRO_LEAK: 'Compounding Micro-Leak',
};

function riskColor(score) {
    if (score >= 65) return 'error';
    if (score >= 40) return 'warning';
    return 'default';
}

function ChainRow({ leak }) {
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
                <TableCell>
                    <Chip size="small" variant="outlined" label={leak.confidence} />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 5, pr: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {leak.summary}
                            </Typography>

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                Root-cause chain
                            </Typography>
                            <Stepper orientation="vertical" activeStep={leak.chain?.length}>
                                {(leak.chain || []).map((step) => (
                                    <Step key={step.step} expanded>
                                        <StepLabel>
                                            <Typography variant="body2" fontWeight={600}>
                                                {step.source}
                                            </Typography>
                                        </StepLabel>
                                        <StepContent>
                                            <Typography variant="body2" color="text.secondary">
                                                {step.signal}
                                            </Typography>
                                        </StepContent>
                                    </Step>
                                ))}
                            </Stepper>

                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
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

export default function HiddenLeakChainTable({ leaks }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Hidden Leaks &amp; Their Root-Cause Chains
                </Typography>
                {!leaks || leaks.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the scan to see results.</Typography>
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
                                <TableCell>Confidence</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaks.map((leak) => (
                                <ChainRow key={leak._id} leak={leak} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
