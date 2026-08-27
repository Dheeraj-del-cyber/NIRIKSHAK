const express = require('express');
const multer = require('multer');
const GSTRecord = require('../models/GSTRecord');
const { validateBatch } = require('../services/validation');
const { parseCsvBuffer } = require('../services/parseCsv');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/gst/upload
// Same shape as /api/invoices/upload, representing the GSTR-2B fetch
// (slide 3, step 1 — simulated here via file upload since a real GST
// portal integration requires GSP/API credentials this demo doesn't have).
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let rows;
    if (req.file) {
      rows = parseCsvBuffer(req.file.buffer);
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      return res.status(400).json({ error: 'Provide a CSV file (field "file") or JSON body { rows: [...] }' });
    }

    const { valid, rejected } = validateBatch(rows, { requireTaxSplit: false });
    const inserted = valid.length ? await GSTRecord.insertMany(valid) : [];

    res.json({
      acceptedCount: inserted.length,
      rejectedCount: rejected.length,
      rejected,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const records = await GSTRecord.find().sort({ createdAt: -1 }).limit(500);
  res.json(records);
});

router.delete('/', async (req, res) => {
  await GSTRecord.deleteMany({});
  res.json({ ok: true });
});

module.exports = router;
