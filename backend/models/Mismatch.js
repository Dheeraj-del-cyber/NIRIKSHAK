const mongoose = require('mongoose');

const MISMATCH_TYPES = [
  'MISSING_IN_GSTR',      // invoice exists in billing system, not in GSTR-2B
  'MISSING_INVOICE',      // exists in GSTR-2B, not in billing system
  'AMOUNT_MISMATCH',      // both exist but values differ beyond tolerance
  'DUPLICATE_INVOICE',    // same invoiceNo+gstin appears more than once
  'DELAYED_FILING',       // GSTR record filed in a later period than invoice date
];

const MismatchSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true },
    gstin: { type: String, required: true },
    period: { type: String, required: true },
    type: { type: String, enum: MISMATCH_TYPES, required: true },
    // 0-100. Combines a severity score for the mismatch type with the
    // adaptive weight learned from past user feedback (services/adaptiveAI.js).
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    itcAtRisk: { type: Number, default: 0 }, // rupee value of ITC potentially lost
    details: { type: String },
    invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    gstRecordRef: { type: mongoose.Schema.Types.ObjectId, ref: 'GSTRecord' },
    status: {
      type: String,
      enum: ['open', 'confirmed', 'false_positive'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mismatch', MismatchSchema);
module.exports.MISMATCH_TYPES = MISMATCH_TYPES;
