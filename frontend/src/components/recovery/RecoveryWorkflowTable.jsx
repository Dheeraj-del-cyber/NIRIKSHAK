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
    Button,
    Stack,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { updateWorkflowStatus } from '../../api/recoveryClient';

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

const STATUS_COLOR = {
    in_progress: 'info',
    pending_review: 'warning',
    recovered: 'success',
    failed: 'error',
    cancelled: 'default',
};

function probColor(p) {
    if (p >= 60) return 'success';
    if (p >= 35) return 'warning';
    return 'error';
}

function WorkflowRow({ workflow, onChanged }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const act = async (status) => {
        setBusy(true);
        try {
            await updateWorkflowStatus(workflow._id, status);
            onChanged?.();
        } finally {
            setBusy(false);
        }
    };

    const canAct = workflow.status === 'in_progress' || workflow.status === 'pending_review';

    return (
        <>
            <TableRow hover>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen((o) => !o)}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip size="small" label={TYPE_LABELS[workflow.leakType] || workflow.leakType} />
                </TableCell>
                <TableCell>{workflow.customerName || workflow.customerId || '—'}</TableCell>
                <TableCell>
                    <Chip size="small" color={probColor(workflow.successProbability)} label={`${workflow.successProbability}%`} />
                </TableCell>
                <TableCell>₹{Number(workflow.recoverableEstimate || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={workflow.decision === 'auto_initiated' ? 'Auto-initiated' : 'Needs review'}
                    />
                </TableCell>
                <TableCell>
                    <Chip size="small" color={STATUS_COLOR[workflow.status] || 'default'} label={workflow.status?.replace('_', ' ')} />
                </TableCell>
                <TableCell align="right">
                    {canAct && (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Button size="small" color="success" disabled={busy} onClick={() => act('recovered')}>
                                Mark Recovered
                            </Button>
                            <Button size="small" color="error" disabled={busy} onClick={() => act('failed')}>
                                Mark Failed
                            </Button>
                        </Stack>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 5, pr: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {workflow.simulationNote}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                Workflow steps
                            </Typography>
                            <List dense disablePadding>
                                {(workflow.steps || []).map((step) => (
                                    <ListItem key={step.order} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            {step.status === 'done' ? (
                                                <CheckCircleOutlineIcon fontSize="small" color="success" />
                                            ) : (
                                                <RadioButtonUncheckedIcon
                                                    fontSize="small"
                                                    color={step.status === 'in_progress' ? 'info' : 'disabled'}
                                                />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${step.order}. ${step.action}`}
                                            secondary={step.status.replace('_', ' ')}
                                        />
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

export default function RecoveryWorkflowTable({ workflows, onChanged }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Recovery Workflows
                </Typography>
                {!workflows || workflows.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the Autonomous Agent to see workflows.</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Type</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Success Prob.</TableCell>
                                <TableCell>Recoverable</TableCell>
                                <TableCell>Decision</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {workflows.map((w) => (
                                <WorkflowRow key={w._id} workflow={w} onChanged={onChanged} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
