require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const invoiceRoutes = require('./routes/invoices');
const gstRoutes = require('./routes/gst');
const analysisRoutes = require('./routes/analysis');
const revenueRoutes = require('./routes/revenue');
const twinRoutes = require('./routes/twin');
const leakageRoutes = require('./routes/leakage');
const recoveryRoutes = require('./routes/recovery');
const insightsRoutes = require('./routes/insights');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nirikshak-backend' }));

app.use('/api/invoices', invoiceRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/twin', twinRoutes);
app.use('/api/leakage', leakageRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/insights', insightsRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`NIRIKSHAK backend listening on port ${PORT} (In-Memory)`));