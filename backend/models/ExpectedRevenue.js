const { v4: uuidv4 } = require('uuid');

// One "digital twin" snapshot per customer per run: what the twin modeled
// they *should* have earned this period vs. what actually landed.
let records = [];

class ExpectedRevenueInstance {
    constructor(data) {
        Object.assign(this, data);
        if (!this._id) this._id = uuidv4();
        if (!this.createdAt) this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

class ExpectedRevenueModel {
    static find(filter = {}) {
        let result = records;
        if (filter.status) result = result.filter((r) => r.status === filter.status);
        if (filter.customerId) result = result.filter((r) => r.customerId === filter.customerId);

        const query = {
            sort: (sortObj) => {
                if (sortObj && sortObj.gap === -1) {
                    result = [...result].sort((a, b) => (b.gap || 0) - (a.gap || 0));
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

    static async insertMany(docs) {
        const instances = docs.map((d) => new ExpectedRevenueInstance(d));
        records.push(...instances);
        return instances;
    }

    static async deleteMany(filter = {}) {
        if (Object.keys(filter).length === 0) {
            records = [];
        } else if (filter.status) {
            records = records.filter((r) => r.status !== filter.status);
        }
        return { deletedCount: 0 };
    }
}

module.exports = ExpectedRevenueModel;
