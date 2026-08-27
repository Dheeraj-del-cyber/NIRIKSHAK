import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

const TYPE_LABELS = {
  MISSING_IN_GSTR: 'Missing in GSTR-2B',
  MISSING_INVOICE: 'Missing Invoice',
  AMOUNT_MISMATCH: 'Amount Mismatch',
  DUPLICATE_INVOICE: 'Duplicate Invoice',
  DELAYED_FILING: 'Delayed Filing',
};

export default function OfficialReportModal({ open, onClose, summary, mismatches }) {
  if (!summary || !mismatches) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogActions sx={{ '@media print': { display: 'none' }, p: 2, bgcolor: '#f5f5f5' }}>
        <Button startIcon={<PrintIcon />} variant="contained" onClick={handlePrint}>
          Print / Save PDF
        </Button>
        <Button startIcon={<CloseIcon />} variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>

      <DialogContent sx={{ p: 6, bgcolor: 'white', color: 'black' }} id="printable-report">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">NIRIKSHAK</Typography>
            <Typography variant="subtitle1" color="text.secondary">Intelligent Audit & Reconciliation Report</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2" color="text.secondary">Generated on</Typography>
            <Typography variant="body1" fontWeight="bold">{new Date().toLocaleDateString()}</Typography>
            <Typography variant="body2">{new Date().toLocaleTimeString()}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Executive Summary */}
        <Typography variant="h6" fontWeight="bold" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Executive Summary</Typography>
        <Box display="flex" gap={4} mb={4}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center', borderColor: 'primary.main', bgcolor: '#f0f4f8' }}>
            <Typography variant="body2" color="text.secondary">Total Mismatches</Typography>
            <Typography variant="h4" color="primary.main">{summary.openCount}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center', borderColor: 'error.main', bgcolor: '#fdf0f0' }}>
            <Typography variant="body2" color="text.secondary">ITC at Risk</Typography>
            <Typography variant="h4" color="error.main">₹{summary.totalItcAtRisk?.toLocaleString('en-IN') || 0}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center', borderColor: 'success.main', bgcolor: '#f0fdf4' }}>
            <Typography variant="body2" color="text.secondary">ITC Protected</Typography>
            <Typography variant="h4" color="success.main">₹{summary.itcProtected?.toLocaleString('en-IN') || 0}</Typography>
          </Paper>
        </Box>

        {/* Detailed Findings */}
        <Typography variant="h6" fontWeight="bold" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Detailed Findings</Typography>
        {mismatches.length === 0 ? (
          <Typography variant="body1">No discrepancies found. All records are reconciled.</Typography>
        ) : (
          <Table size="small" sx={{ mb: 4, '& .MuiTableCell-root': { borderColor: '#e0e0e0' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Invoice No</strong></TableCell>
                <TableCell><strong>GSTIN</strong></TableCell>
                <TableCell><strong>Discrepancy Type</strong></TableCell>
                <TableCell align="right"><strong>ITC Impact</strong></TableCell>
                <TableCell><strong>Notes</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mismatches.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.invoiceNo}</TableCell>
                  <TableCell>{m.gstin}</TableCell>
                  <TableCell>
                    {TYPE_LABELS[m.type] || m.type}
                    {m.isEarlyWarning && (
                      <Typography variant="caption" display="block" color="error" fontWeight="bold">
                        * AI Early Warning
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ color: m.itcAtRisk > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>
                    ₹{Number(m.itcAtRisk || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{m.details}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Divider sx={{ mb: 4 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          This report is generated by NIRIKSHAK Adaptive AI Reconciliation Engine. <br/>
          Confidential & Proprietary.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
