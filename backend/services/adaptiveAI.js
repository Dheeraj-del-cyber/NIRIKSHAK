// Adaptive AI Model (slide 3, step 3) + Continuous Feedback Loop (step 5).
//
// This is intentionally a transparent, rule-based reconciliation engine
// rather than a black-box model — for a reconciliation/compliance tool that
// is the right tradeoff (auditors and finance teams need to see *why* a
// mismatch was flagged), but it "learns" in the sense described in the
// slides: every mismatch type carries a weight in PatternWeight that is
// nudged up or down by user feedback (see recordFeedback), so its risk
// scores adapt over time and repeat-confirmed patterns get surfaced with
// higher priority while frequently-dismissed ones quiet down.

const Invoice = require('../models/Invoice');
const GSTRecord = require('../models/GSTRecord');
const Mismatch = require('../models/Mismatch');
const PatternWeight = require('../models/PatternWeight');
const { MISMATCH_TYPES } = require('../models/Mismatch');

const BASE_SEVERITY = {
  MISSING_IN_GSTR: 70,
  MISSING_INVOICE: 60,
  AMOUNT_MISMATCH: 55,
  DUPLICATE_INVOICE: 40,
  DELAYED_FILING: 35,
};

const AMOUNT_TOLERANCE = Number(process.env.AMOUNT_TOLERANCE || 1);
const AMOUNT_TOLERANCE_PCT = Number(process.env.AMOUNT_TOLERANCE_PCT || 0.01);

function amountsMatch(a, b) {
  const diff = Math.abs(a - b);
  const pctTolerance = Math.max(a, b) * AMOUNT_TOLERANCE_PCT;
  return diff <= Math.max(AMOUNT_TOLERANCE, pctTolerance);
}

async function getWeight(type) {
  let pw = await PatternWeight.findOne({ type });
  if (!pw) pw = await PatternWeight.create({ type });
  return pw.weight;
}

async function ensureWeights() {
  for (const type of MISMATCH_TYPES) {
    await PatternWeight.updateOne({ type }, { $setOnInsert: { type } }, { upsert: true });
  }
}

function key(invoiceNo, gstin, period) {
  return `${invoiceNo}::${gstin}::${period}`;
}

/**
 * Runs a full reconciliation pass over all *valid* invoices and GST
 * records currently in the database, replacing any existing 'open'
 * mismatches (confirmed/false_positive ones are preserved as history).
 */
async function runReconciliation() {
  await ensureWeights();

  const invoices = await Invoice.find({ 'validation.isValid': true });
  const gstRecords = await GSTRecord.find({ 'validation.isValid': true });

  const invoiceMap = new Map();
  const invoiceCounts = new Map();
  for (const inv of invoices) {
    const k = key(inv.invoiceNo, inv.gstin, inv.period);
    invoiceCounts.set(k, (invoiceCounts.get(k) || 0) + 1);
    if (!invoiceMap.has(k)) invoiceMap.set(k, inv);
  }

  const gstMap = new Map();
  for (const rec of gstRecords) {
    gstMap.set(key(rec.invoiceNo, rec.gstin, rec.period), rec);
  }

  const weights = {};
  for (const type of MISMATCH_TYPES) weights[type] = await getWeight(type);

  const found = [];

  // Duplicate detection + missing-in-GSTR + amount mismatch (invoice -> GSTR direction)
  for (const [k, inv] of invoiceMap.entries()) {
    if (invoiceCounts.get(k) > 1) {
      found.push(
        buildMismatch('DUPLICATE_INVOICE', inv, null, weights, {
          detail: `Invoice ${inv.invoiceNo} appears ${invoiceCounts.get(k)} times for GSTIN ${inv.gstin} in period ${inv.period}`,
        })
      );
    }

    const gstRec = gstMap.get(k);
    if (!gstRec) {
      found.push(
        buildMismatch('MISSING_IN_GSTR', inv, null, weights, {
          detail: `Invoice ${inv.invoiceNo} found in billing system but not in GSTR-2B for period ${inv.period}`,
        })
      );
      continue;
    }

    if (
      !amountsMatch(inv.totalValue, gstRec.totalValue) ||
      !amountsMatch(inv.totalTax, gstRec.totalTax)
    ) {
      found.push(
        buildMismatch('AMOUNT_MISMATCH', inv, gstRec, weights, {
          detail: `Billing totalValue ${inv.totalValue} / totalTax ${inv.totalTax} vs GSTR-2B totalValue ${gstRec.totalValue} / totalTax ${gstRec.totalTax}`,
        })
      );
    }

    if (gstRec.period > inv.period) {
      found.push(
        buildMismatch('DELAYED_FILING', inv, gstRec, weights, {
          detail: `Invoice dated in period ${inv.period} but filed in GSTR-2B under period ${gstRec.period}`,
        })
      );
    }
  }

  // Records present in GSTR-2B with no corresponding billing-system invoice
  for (const [k, rec] of gstMap.entries()) {
    if (!invoiceMap.has(k)) {
      found.push(
        buildMismatch('MISSING_INVOICE', null, rec, weights, {
          detail: `GSTR-2B contains invoice ${rec.invoiceNo} (GSTIN ${rec.gstin}, period ${rec.period}) with no matching billing-system invoice`,
        })
      );
    }
  }

  // Replace open mismatches only — keep history of reviewed ones.
  await Mismatch.deleteMany({ status: 'open' });
  if (found.length) await Mismatch.insertMany(found);

  return { created: found.length };
}

function buildMismatch(type, inv, gstRec, weights, { detail }) {
  const base = BASE_SEVERITY[type];
  const riskScore = Math.max(0, Math.min(100, Math.round(base * weights[type])));
  const source = inv || gstRec;
  const itcAtRisk =
    type === 'AMOUNT_MISMATCH' && inv && gstRec
      ? Math.abs(inv.totalTax - gstRec.totalTax)
      : type === 'MISSING_IN_GSTR' && inv
      ? inv.totalTax
      : type === 'MISSING_INVOICE' && gstRec
      ? gstRec.totalTax
      : 0;

  return {
    invoiceNo: source.invoiceNo,
    gstin: source.gstin,
    period: source.period,
    type,
    riskScore,
    itcAtRisk: Math.round(itcAtRisk * 100) / 100,
    details: detail,
    invoiceRef: inv ? inv._id : undefined,
    gstRecordRef: gstRec ? gstRec._id : undefined,
    status: 'open',
  };
}

/**
 * Continuous Feedback Loop: user confirms a flagged mismatch was real, or
 * marks it a false positive. Adjusts that mismatch type's weight with a
 * simple bounded exponential update so the model's future risk scores for
 * that pattern rise (confirmed) or fall (false positive) over time.
 */
async function recordFeedback(mismatchId, outcome) {
  if (!['confirmed', 'false_positive'].includes(outcome)) {
    throw new Error("outcome must be 'confirmed' or 'false_positive'");
  }
  const mismatch = await Mismatch.findById(mismatchId);
  if (!mismatch) throw new Error('Mismatch not found');

  mismatch.status = outcome;
  await mismatch.save();

  const pw = (await PatternWeight.findOne({ type: mismatch.type })) ||
    (await PatternWeight.create({ type: mismatch.type }));

  const LEARNING_RATE = 0.08;
  if (outcome === 'confirmed') {
    pw.weight = Math.min(2.0, pw.weight + LEARNING_RATE * (2.0 - pw.weight));
    pw.timesConfirmed += 1;
  } else {
    pw.weight = Math.max(0.2, pw.weight - LEARNING_RATE * (pw.weight - 0.2));
    pw.timesRejected += 1;
  }
  await pw.save();

  return { mismatch, weight: pw.weight };
}

module.exports = { runReconciliation, recordFeedback, amountsMatch };
