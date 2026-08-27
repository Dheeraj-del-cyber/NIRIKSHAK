const { parse } = require('csv-parse/sync');

// Expected CSV headers (case-insensitive):
// invoiceNo, gstin, invoiceDate, taxableValue, cgst, sgst, igst, totalTax, totalValue, period
function parseCsvBuffer(buffer) {
  const records = parse(buffer, {
    columns: (header) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((r) => ({
    invoiceNo: r.invoiceNo || r.InvoiceNo || r.invoice_no,
    gstin: (r.gstin || r.GSTIN || '').toUpperCase(),
    invoiceDate: r.invoiceDate || r.InvoiceDate || r.invoice_date,
    taxableValue: Number(r.taxableValue),
    cgst: r.cgst !== undefined ? Number(r.cgst) : 0,
    sgst: r.sgst !== undefined ? Number(r.sgst) : 0,
    igst: r.igst !== undefined ? Number(r.igst) : 0,
    totalTax: Number(r.totalTax),
    totalValue: Number(r.totalValue),
    period: r.period || r.Period,
  }));
}

// Generic CSV -> array-of-objects parser (headers kept as-is, values kept as
// strings). Used by the revenue-leakage upload routes, which each map the
// raw columns onto their own typed shape.
function parseGenericCsvBuffer(buffer) {
  return parse(buffer, {
    columns: (header) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    trim: true,
  });
}

module.exports = { parseCsvBuffer, parseGenericCsvBuffer };