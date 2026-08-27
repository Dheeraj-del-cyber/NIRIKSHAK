import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Stack, Button, Alert } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import SummaryCards from './SummaryCards';
import RiskChart from './RiskChart';
import MismatchTable from './MismatchTable';
import OfficialReportModal from './OfficialReportModal';
import { getSummary, getMismatches, sendFeedback, getTextReportUrl, getXmlReportUrl } from '../api/client';

export default function Dashboard({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [mismatches, setMismatches] = useState([]);
  const [error, setError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [summaryRes, mismatchRes] = await Promise.all([
        getSummary(),
        getMismatches({ status: 'open' }),
      ]);
      setSummary(summaryRes.data);
      setMismatches(mismatchRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleFeedback = async (id, outcome) => {
    try {
      await sendFeedback(id, outcome);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <SummaryCards summary={summary} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <RiskChart byType={summary?.byType} />
        </Grid>
        <Grid item xs={12} md={7}>
          <MismatchTable mismatches={mismatches} onFeedback={handleFeedback} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={() => setReportOpen(true)}
        >
          Official Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<CodeIcon />}
          href={getXmlReportUrl()}
          target="_blank"
        >
          Machine Report (XML)
        </Button>
      </Stack>
      
      <OfficialReportModal 
        open={reportOpen} 
        onClose={() => setReportOpen(false)} 
        summary={summary} 
        mismatches={mismatches} 
      />
    </Stack>
  );
}
