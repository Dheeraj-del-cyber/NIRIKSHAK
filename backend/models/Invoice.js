const mongoose = require('mongoose');

// Represents an invoice as it exists in the business's own billing system.
// This is the "left side" of the reconciliation described in slide 3
// (Data Acquisition -> billing system).
const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, trim: true, index: true },
    gstin: { type: String, required: true, trim: true, uppercase: true, index: true },
    invoiceDate: { type: Date, required: true },
    taxableValue: { type: Number, required: true, min: 0 },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    period: { type: String, required: true }, // e.g. "2026-07" - filing period
    source: { type: String, default: 'billing_system' },
    // Set by the validation layer (services/validation.js) before an
    // invoice is considered eligible for reconciliation.
    validation: {
      isValid: { type: Boolean, default: true },
      errors: [{ type: String }],
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ invoiceNo: 1, gstin: 1, period: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
