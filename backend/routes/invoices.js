const express = require('express');
const multer = require('multer');
const Invoice = require('../models/Invoice');
const { validateBatch } = require('../services/validation');
const { parseCsvBuffer } = require('../services/parseCsv');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/invoices/upload
// Accepts either a multipart CSV file (field name "file") or a raw JSON
// body: { rows: [ {invoiceNo, gstin, invoiceDate, taxableValue, cgst, sgst, igst, totalTax, totalValue, period}, ... ] }
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
    const inserted = valid.length ? await Invoice.insertMany(valid) : [];

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
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(500);
  res.json(invoices);
});

router.delete('/', async (req, res) => {
  await Invoice.deleteMany({});
  res.json({ ok: true });
});

module.exports = router;
