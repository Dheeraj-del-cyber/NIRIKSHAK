const express = require('express');
const multer = require('multer');
const Invoice = require('../models/Invoice');
const { validateBatch } = require('../services/validation');
const { parseCsvBuffer } = require('../services/parseCsv');
const GSTRecord = require('../models/GSTRecord');
const { runReconciliation } = require('../services/adaptiveAI');

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

router.post('/simulate', async (req, res) => {
  try {
    const demoInvoice = {
      invoiceNo: "INV-10452",
      gstin: "29ABCDE1234F1Z5",
      invoiceDate: new Date().toISOString(),
      period: "2024-01",
      taxableValue: 50000,
      totalTax: 9000,
      totalValue: 59000,
      cgst: 4500,
      sgst: 4500,
      igst: 0,
      validation: { isValid: true, errors: [] }
    };

    const demoGstRecord = {
      invoiceNo: "INV-10452",
      gstin: "29ABCDE1234F1Z5",
      invoiceDate: new Date().toISOString(),
      period: "2024-01",
      taxableValue: 45000, // Reduced to create mismatch
      totalTax: 8100, // Reduced to create mismatch
      totalValue: 53100,
      cgst: 4050,
      sgst: 4050,
      igst: 0,
      validation: { isValid: true, errors: [] }
    };

    await Invoice.insertMany([demoInvoice]);
    await GSTRecord.insertMany([demoGstRecord]);
    
    // Automatically trigger analysis
    const analysisResult = await runReconciliation();

    res.json({ success: true, analysis: analysisResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
