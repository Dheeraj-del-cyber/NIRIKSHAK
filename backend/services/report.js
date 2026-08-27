// Dual-Format Output Generation (slide 3, step 4).
// - Machine format (XML): structured, meant to feed back into retraining /
//   external systems.
// - User format (JSON): human-readable summary with plain-language
//   insights, used directly by the dashboard.

const { create } = require('xmlbuilder2');
const Mismatch = require('../models/Mismatch');

async function buildHumanReport() {
  const mismatches = await Mismatch.find().sort({ riskScore: -1 }).lean();

  const totalItcAtRisk = mismatches.reduce((sum, m) => sum + (m.itcAtRisk || 0), 0);
  const byType = {};
  for (const m of mismatches) {
    byType[m.type] = (byType[m.type] || 0) + 1;
  }

  const insights = [];
  if (byType.MISSING_IN_GSTR) {
    insights.push(
      `${byType.MISSING_IN_GSTR} invoice(s) you've billed are missing from your supplier's/your own GSTR-2B filing — follow up before the ITC claim window closes.`
    );
  }
  if (byType.AMOUNT_MISMATCH) {
    insights.push(
      `${byType.AMOUNT_MISMATCH} invoice(s) have amounts that don't match between your books and GSTR-2B — check for rounding, discount, or credit-note errors.`
    );
  }
  if (byType.DUPLICATE_INVOICE) {
    insights.push(
      `${byType.DUPLICATE_INVOICE} duplicate invoice number(s) detected — possible double-billing or re-upload.`
    );
  }
  if (byType.DELAYED_FILING) {
    insights.push(
      `${byType.DELAYED_FILING} invoice(s) were filed in a later GST period than invoiced — may affect the ITC claim timeline.`
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMismatches: mismatches.length,
      totalItcAtRisk: Math.round(totalItcAtRisk * 100) / 100,
      byType,
    },
    insights,
    mismatches,
  };
}

async function buildMachineXml() {
  const mismatches = await Mismatch.find().lean();

  const root = create({ version: '1.0' }).ele('ReconciliationOutput', {
    generatedAt: new Date().toISOString(),
  });

  const mismatchesEl = root.ele('Mismatches');
  for (const m of mismatches) {
    mismatchesEl
      .ele('Mismatch', {
        id: String(m._id),
        type: m.type,
        status: m.status,
      })
      .ele('InvoiceNo').txt(m.invoiceNo).up()
      .ele('GSTIN').txt(m.gstin).up()
      .ele('Period').txt(m.period).up()
      .ele('RiskScore').txt(String(m.riskScore)).up()
      .ele('ItcAtRisk').txt(String(m.itcAtRisk || 0)).up()
      .up();
  }

  return root.end({ prettyPrint: true });
}

module.exports = { buildHumanReport, buildMachineXml };
