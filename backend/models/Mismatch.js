const { v4: uuidv4 } = require('uuid');

// Note: NIRIKSHAK runs in-memory right now, so this is just for reference/typing.
const MISMATCH_TYPES = [
  'MISSING_IN_GSTR',
  'MISSING_INVOICE',
  'AMOUNT_MISMATCH',
  'DUPLICATE_INVOICE',
  'DELAYED_FILING',
];

const schemaShape = {
  _id: String,
  invoiceNo: String,
  gstin: String,
  period: String,
  type: String, // from MISMATCH_TYPES
  riskScore: Number, // 0-100 computed based on pattern weight
  itcAtRisk: Number, // calculated monetary impact
  details: String, // human readable reason
  expectedAmount: Number,
  receivedAmount: Number,
  difference: Number,
  confidenceScore: Number,
  recommendation: String,
  isEarlyWarning: { type: Boolean, default: false },
  invoiceRef: String,
  gstRecordRef: String,
  status: {
    type: String,
    enum: ['open', 'confirmed', 'false_positive', 'resolved'],
    default: 'open',
  },
  createdAt: Date,
  updatedAt: Date,
};

let records = [];

class MismatchModel {
  static find(filter = {}) {
    let result = records;
    if (filter.status) result = result.filter(r => r.status === filter.status);
    if (filter.type) result = result.filter(r => r.type === filter.type);

    const query = {
      sort: (sortObj) => {
        result = [...result].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        return query;
      },
      lean: () => {
        return query;
      },
      then: (resolve) => {
        resolve(result);
      }
    };
    return query;
  }

  static findById(id) {
    const record = records.find(r => r._id === id);
    if (!record) return null;
    return {
      ...record,
      save: async function() {
        const idx = records.findIndex(r => r._id === this._id);
        if (idx !== -1) {
          records[idx] = { ...this, updatedAt: new Date() };
        }
        return this;
      }
    };
  }

  static async insertMany(docs) {
    const toInsert = docs.map(d => ({ ...d, _id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }));
    records.push(...toInsert);
    return toInsert;
  }

  static async deleteMany(filter = {}) {
    if (Object.keys(filter).length === 0) {
      records = [];
    } else if (filter.status === 'open') {
      records = records.filter(r => r.status !== 'open');
    }
    return { deletedCount: records.length };
  }
}

MismatchModel.MISMATCH_TYPES = MISMATCH_TYPES;

module.exports = MismatchModel;
module.exports.MISMATCH_TYPES = MISMATCH_TYPES;
