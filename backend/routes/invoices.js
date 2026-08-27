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
    const scenario = req.body || {};
    const invoiceNo = scenario.invoiceNo || "INV-10452";
    const gstin = scenario.gstin || "29ABCDE1234F1Z5";
    const totalValue = scenario.totalValue || 59000;
    const totalTax = scenario.totalTax || 9000;
    const gstrTax = scenario.gstrTax !== undefined ? scenario.gstrTax : 8100;
    
    const taxableValue = totalValue - totalTax;

    const demoInvoice = {
      invoiceNo,
      gstin,
      invoiceDate: new Date().toISOString(),
      period: "2024-01",
      taxableValue,
      totalTax,
      totalValue,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      validation: { isValid: true, errors: [] }
    };

    const recordsToInsert = [];
    if (gstrTax > 0) {
      const gstrTaxableValue = taxableValue * (gstrTax / totalTax);
      const gstrTotalValue = gstrTaxableValue + gstrTax;
      
      const demoGstRecord = {
        invoiceNo,
        gstin,
        invoiceDate: new Date().toISOString(),
        period: "2024-01",
        taxableValue: gstrTaxableValue,
        totalTax: gstrTax,
        totalValue: gstrTotalValue,
        cgst: gstrTax / 2,
        sgst: gstrTax / 2,
        igst: 0,
        validation: { isValid: true, errors: [] }
      };
      recordsToInsert.push(demoGstRecord);
    }

    await Invoice.insertMany([demoInvoice]);
    if (recordsToInsert.length > 0) {
      await GSTRecord.insertMany(recordsToInsert);
    }
    
    // Automatically trigger analysis
    const analysisResult = await runReconciliation();

    res.json({ success: true, analysis: analysisResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
