// Preprocessing / Math Data Validation Layer (slide 3, step 2).
// Cleans + standardizes incoming records and performs numeric/structural
// checks BEFORE anything reaches the adaptive AI model. Records that fail
// are marked invalid with reasons and excluded from reconciliation, but are
// still stored so the user can see and fix them.

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function isFiniteNonNegative(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/**
 * Validates a single normalized record (invoice or GST record shape).
 * Returns { isValid, errors: string[] }.
 */
function validateRecord(record, { requireTaxSplit = false } = {}) {
  const errors = [];

  if (!record.invoiceNo || String(record.invoiceNo).trim() === '') {
    errors.push('Missing invoice number');
  }

  if (!record.gstin || !GSTIN_REGEX.test(String(record.gstin).toUpperCase())) {
    errors.push('Invalid or missing GSTIN format');
  }

  if (!record.invoiceDate || isNaN(new Date(record.invoiceDate).getTime())) {
    errors.push('Missing or unparseable invoice date');
  }

  if (!record.period || !/^\d{4}-\d{2}$/.test(record.period)) {
    errors.push('Missing or malformed period (expected YYYY-MM)');
  }

  if (!isFiniteNonNegative(record.taxableValue)) {
    errors.push('taxableValue must be a non-negative number');
  }
  if (!isFiniteNonNegative(record.totalTax)) {
    errors.push('totalTax must be a non-negative number');
  }
  if (!isFiniteNonNegative(record.totalValue)) {
    errors.push('totalValue must be a non-negative number');
  }

  // Structural/math check: taxableValue + totalTax should equal totalValue
  // (within a small rounding tolerance).
  if (
    isFiniteNonNegative(record.taxableValue) &&
    isFiniteNonNegative(record.totalTax) &&
    isFiniteNonNegative(record.totalValue)
  ) {
    const expected = record.taxableValue + record.totalTax;
    if (Math.abs(expected - record.totalValue) > 1) {
      errors.push(
        `Tax computation check failed: taxableValue + totalTax (${expected.toFixed(
          2
        )}) does not equal totalValue (${record.totalValue.toFixed(2)})`
      );
    }
  }

  if (requireTaxSplit) {
    const cgst = record.cgst || 0;
    const sgst = record.sgst || 0;
    const igst = record.igst || 0;
    if (isFiniteNonNegative(record.totalTax)) {
      const splitSum = cgst + sgst + igst;
      if (Math.abs(splitSum - record.totalTax) > 1) {
        errors.push(
          `CGST+SGST+IGST (${splitSum.toFixed(2)}) does not match totalTax (${record.totalTax.toFixed(
            2
          )})`
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates an array of raw parsed rows (from CSV/JSON) and returns
 * { valid: [], rejected: [{row, errors}] }.
 */
function validateBatch(rows, opts = {}) {
  const valid = [];
  const rejected = [];
  for (const row of rows) {
    const { isValid, errors } = validateRecord(row, opts);
    if (isValid) {
      valid.push({ ...row, validation: { isValid: true, errors: [] } });
    } else {
      rejected.push({ row, errors });
    }
  }
  return { valid, rejected };
}

module.exports = { GSTIN_REGEX, validateRecord, validateBatch };
