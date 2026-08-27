// Populates the database with a realistic small sample so the dashboard
// isn't empty on first run. Includes deliberately-injected mismatches of
// every type described in the deck, so the reconciliation engine and
// dashboard have something meaningful to show.
require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const GSTRecord = require('../models/GSTRecord');
const Mismatch = require('../models/Mismatch');
const PatternWeight = require('../models/PatternWeight');

const PERIOD = '2026-07';
const GSTIN = '29ABCDE1234F1Z5';
const GSTIN_2 = '27PQRSX5678K1Z2';

function inv(overrides) {
  return {
    invoiceNo: 'INV-0000',
    gstin: GSTIN,
    invoiceDate: new Date('2026-07-15'),
    taxableValue: 10000,
    cgst: 900,
    sgst: 900,
    igst: 0,
    totalTax: 1800,
    totalValue: 11800,
    period: PERIOD,
    source: 'billing_system',
    validation: { isValid: true, errors: [] },
    ...overrides,
  };
}

function gstr(overrides) {
  return {
    invoiceNo: 'INV-0000',
    gstin: GSTIN,
    invoiceDate: new Date('2026-07-15'),
    taxableValue: 10000,
    totalTax: 1800,
    totalValue: 11800,
    period: PERIOD,
    source: 'gstr2b',
    validation: { isValid: true, errors: [] },
    ...overrides,
  };
}

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nirikshak';
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Clearing existing data...');
  await Promise.all([
    Invoice.deleteMany({}),
    GSTRecord.deleteMany({}),
    Mismatch.deleteMany({}),
    PatternWeight.deleteMany({}),
  ]);

  const invoices = [
    // 1. Perfect match - no mismatch
    inv({ invoiceNo: 'INV-1001', taxableValue: 10000, totalTax: 1800, totalValue: 11800 }),

    // 2. Amount mismatch - GST portal shows a different tax value
    inv({ invoiceNo: 'INV-1002', taxableValue: 20000, cgst: 1800, sgst: 1800, totalTax: 3600, totalValue: 23600 }),

    // 3. Missing in GSTR - billed but supplier hasn't filed it yet
    inv({ invoiceNo: 'INV-1003', taxableValue: 15000, cgst: 1350, sgst: 1350, totalTax: 2700, totalValue: 17700 }),

    // 4. Duplicate invoice number (uploaded twice)
    inv({ invoiceNo: 'INV-1004', taxableValue: 5000, cgst: 450, sgst: 450, totalTax: 900, totalValue: 5900 }),
    inv({ invoiceNo: 'INV-1004', taxableValue: 5000, cgst: 450, sgst: 450, totalTax: 900, totalValue: 5900 }),

    // 5. Delayed filing - invoiced in July, filed in August's GSTR-2B
    inv({ invoiceNo: 'INV-1005', taxableValue: 8000, cgst: 720, sgst: 720, totalTax: 1440, totalValue: 9440 }),

    // 6. Second GSTIN, clean match, for variety
    inv({ invoiceNo: 'INV-2001', gstin: GSTIN_2, taxableValue: 12000, igst: 2160, cgst: 0, sgst: 0, totalTax: 2160, totalValue: 14160 }),
  ];

  const gstRecords = [
    gstr({ invoiceNo: 'INV-1001', taxableValue: 10000, totalTax: 1800, totalValue: 11800 }),
    // Mismatched amount vs invoice above (23600 vs 23200)
    gstr({ invoiceNo: 'INV-1002', taxableValue: 20000, totalTax: 3200, totalValue: 23200 }),
    // INV-1003 intentionally absent (missing in GSTR)
    gstr({ invoiceNo: 'INV-1004', taxableValue: 5000, totalTax: 900, totalValue: 5900 }),
    // INV-1005 filed one period late
    gstr({ invoiceNo: 'INV-1005', taxableValue: 8000, totalTax: 1440, totalValue: 9440, period: '2026-08' }),
    gstr({ invoiceNo: 'INV-2001', gstin: GSTIN_2, taxableValue: 12000, totalTax: 2160, totalValue: 14160 }),
    // A record present in GSTR-2B with no matching billing-system invoice at all
    gstr({ invoiceNo: 'INV-9999', gstin: GSTIN, taxableValue: 3000, totalTax: 540, totalValue: 3540 }),
  ];

  await Invoice.insertMany(invoices);
  await GSTRecord.insertMany(gstRecords);

  console.log(`Seeded ${invoices.length} invoices and ${gstRecords.length} GSTR-2B records.`);
  console.log('Run POST /api/analysis/run (or click "Run Analysis" in the dashboard) to generate mismatches.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
