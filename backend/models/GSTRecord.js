const mongoose = require('mongoose');

// Represents the corresponding record as it appears on the GST portal
// (GSTR-2B). This is the "right side" of the reconciliation.
const GSTRecordSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, trim: true, index: true },
    gstin: { type: String, required: true, trim: true, uppercase: true, index: true },
    invoiceDate: { type: Date, required: true },
    taxableValue: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    period: { type: String, required: true },
    source: { type: String, default: 'gstr2b' },
    validation: {
      isValid: { type: Boolean, default: true },
      errors: [{ type: String }],
    },
  },
  { timestamps: true }
);

GSTRecordSchema.index({ invoiceNo: 1, gstin: 1, period: 1 });

module.exports = mongoose.model('GSTRecord', GSTRecordSchema);
