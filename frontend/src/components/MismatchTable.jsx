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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';

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
  const [selectedMismatch, setSelectedMismatch] = React.useState(null);

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
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Invoice No.</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>GSTIN</TableCell>
                <TableCell>Type</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Risk</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>ITC at Risk</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mismatches.map((m) => (
                <TableRow key={m._id} hover>
                  <TableCell>{m.invoiceNo}</TableCell>
                  <TableCell>{m.gstin}</TableCell>
                  <TableCell>
                    {m.isEarlyWarning && (
                      <Chip size="small" color="error" label="Early Warning" sx={{ mr: 1 }} />
                    )}
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
                    <Tooltip title="Investigate">
                      <IconButton size="small" color="primary" onClick={() => setSelectedMismatch(m)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
          </Box>
        )}
      </CardContent>

      {/* Explainability Dialog */}
      <Dialog open={!!selectedMismatch} onClose={() => setSelectedMismatch(null)} maxWidth="sm" fullWidth>
        {selectedMismatch && (
          <>
            <DialogTitle>
              Investigation Details: {selectedMismatch.invoiceNo}
              {selectedMismatch.isEarlyWarning && (
                <Chip size="small" color="error" label="AI Early Warning" sx={{ ml: 2 }} />
              )}
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{TYPE_LABELS[selectedMismatch.type] || selectedMismatch.type}</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">Why it was flagged</Typography>
                <Typography variant="body1">{selectedMismatch.details}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">What was expected</Typography>
                  <Typography variant="body1">₹{Number(selectedMismatch.expectedAmount || 0).toLocaleString('en-IN')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">What was received</Typography>
                  <Typography variant="body1">₹{Number(selectedMismatch.receivedAmount || 0).toLocaleString('en-IN')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Difference</Typography>
                  <Typography variant="body1" color="error.main" fontWeight={600}>₹{Number(selectedMismatch.difference || 0).toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">AI Confidence Score</Typography>
                <Chip size="small" color={riskColor(selectedMismatch.confidenceScore)} label={`${selectedMismatch.confidenceScore}%`} />
              </Box>
              
              {selectedMismatch.recommendation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Recommended Action:</strong> {selectedMismatch.recommendation}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              {selectedMismatch.status === 'open' && (
                <>
                  <Button onClick={() => { onFeedback(selectedMismatch._id, 'false_positive'); setSelectedMismatch(null); }}>
                    Dismiss as False Positive
                  </Button>
                  <Button variant="contained" color="error" onClick={() => { onFeedback(selectedMismatch._id, 'confirmed'); setSelectedMismatch(null); }}>
                    Confirm Error
                  </Button>
                </>
              )}
              <Button onClick={() => setSelectedMismatch(null)} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  );
}
