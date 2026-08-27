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
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const STATUS_COLOR = {
    leaking: 'error',
    on_track: 'success',
    contract_closed: 'default',
};

const STATUS_LABEL = {
    leaking: 'Leaking',
    on_track: 'On Track',
    contract_closed: 'Contract Closed',
};

function GapRow({ snapshot }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow hover>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen((o) => !o)}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell>{snapshot.customerName || snapshot.customerId}</TableCell>
                <TableCell>₹{Number(snapshot.expectedRevenue || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>₹{Number(snapshot.actualRevenue || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>
                    ₹{Number(snapshot.gap || 0).toLocaleString('en-IN')}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                        ({snapshot.gapPct}%)
                    </Typography>
                </TableCell>
                <TableCell>
                    <Chip size="small" color={STATUS_COLOR[snapshot.status] || 'default'} label={STATUS_LABEL[snapshot.status] || snapshot.status} />
                </TableCell>
                <TableCell>
                    <Chip size="small" variant="outlined" label={snapshot.confidence} />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 5, pr: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                How the twin got here
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {snapshot.explanation}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                Run-rate: ₹{Number(snapshot.runRate || 0).toLocaleString('en-IN')} · Billed: ₹
                                {Number(snapshot.billedAmount || 0).toLocaleString('en-IN')} · Collected: ₹
                                {Number(snapshot.collectedAmount || 0).toLocaleString('en-IN')} · Net transactions: ₹
                                {Number(snapshot.netTransactionAmount || 0).toLocaleString('en-IN')}
                            </Typography>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function TwinGapTable({ snapshots }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Per-Customer Twin Snapshots
                </Typography>
                {!snapshots || snapshots.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">Run the digital twin to see results.</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Customer</TableCell>
                                <TableCell>Expected</TableCell>
                                <TableCell>Actual</TableCell>
                                <TableCell>Gap</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Confidence</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {snapshots.map((s) => (
                                <GapRow key={s._id} snapshot={s} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
