const { v4: uuidv4 } = require('uuid');

const LEAK_TYPES = [
    'UNUSUAL_DISCOUNT',
    'UNUSUAL_REFUND',
    'OVERDUE_PAYMENT',
    'FAILED_RENEWAL',
    'CHURN_RISK',
];

let records = [];

class RevenueLeakInstance {
    constructor(data) {
        Object.assign(this, data);
        if (!this._id) this._id = uuidv4();
        if (!this.createdAt) this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    async save() {
        this.updatedAt = new Date();
        const idx = records.findIndex((r) => r._id === this._id);
        if (idx >= 0) records[idx] = this;
        else records.push(this);
        return this;
    }
}

class RevenueLeakModel {
    static find(filter = {}) {
        let result = records;
        if (filter.status) result = result.filter((r) => r.status === filter.status);
        if (filter.type) result = result.filter((r) => r.type === filter.type);

        const query = {
            sort: (sortObj) => {
                if (sortObj && sortObj.riskScore === -1) {
                    result.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
                }
                return query;
            },
            limit: (n) => {
                result = result.slice(0, n);
                return query;
            },
            lean: () => query,
            then: (resolve) => resolve(result),
        };
        return query;
    }

    static async findById(id) {
        return records.find((r) => r._id === id) || null;
    }

    static async insertMany(docs) {
        const instances = docs.map((d) => new RevenueLeakInstance(d));
        records.push(...instances);
        return instances;
    }

    static async deleteMany(filter = {}) {
        if (Object.keys(filter).length === 0) {
            records = [];
        } else if (filter.status === 'open') {
            records = records.filter((r) => r.status !== 'open');
        }
        return { deletedCount: 0 };
    }
}

module.exports = RevenueLeakModel;
module.exports.LEAK_TYPES = LEAK_TYPES;