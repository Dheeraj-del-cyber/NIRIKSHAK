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
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const TYPE_LABELS = {
  MISSING_IN_GSTR: 'Missing in GSTR-2B',
  MISSING_INVOICE: 'Missing Invoice',
  AMOUNT_MISMATCH: 'Amount Mismatch',
  DUPLICATE_INVOICE: 'Duplicate Invoice',
  DELAYED_FILING: 'Delayed Filing',
};

function riskColor(score) {
  if (score >= 65) return 'error';
  if (score >= 40) return 'warning';
  return 'default';
}

export default function MismatchTable({ mismatches, onFeedback }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Flagged Mismatches
        </Typography>
        {mismatches.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nothing flagged yet.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice No.</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>ITC at Risk</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Feedback</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mismatches.map((m) => (
                <TableRow key={m._id} hover>
                  <TableCell>{m.invoiceNo}</TableCell>
                  <TableCell>{m.gstin}</TableCell>
                  <TableCell>
                    <Tooltip title={m.details || ''}>
                      <span>{TYPE_LABELS[m.type] || m.type}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={riskColor(m.riskScore)} label={m.riskScore} />
                  </TableCell>
                  <TableCell>₹{Number(m.itcAtRisk || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={m.status}
                      color={
                        m.status === 'confirmed'
                          ? 'error'
                          : m.status === 'false_positive'
                          ? 'default'
                          : 'info'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    {m.status === 'open' && (
                      <>
                        <Tooltip title="Confirm - this is a real issue">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onFeedback(m._id, 'confirmed')}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="False positive">
                          <IconButton
                            size="small"
                            onClick={() => onFeedback(m._id, 'false_positive')}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
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
