const { v4: uuidv4 } = require('uuid');

// Customer profile used for churn/attrition prediction.
let records = [];

class CustomerModel {
    static async countDocuments(filter = {}) {
        let result = records;
        if (filter.customerId) result = result.filter((r) => r.customerId === filter.customerId);
        return result.length;
    }

    static find(filter = {}) {
        let result = records;
        const query = {
            sort: () => {
                result = [...result].reverse();
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
        const toInsert = docs.map((d) => ({ ...d, _id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }));
        records.push(...toInsert);
        return toInsert;
    }

    static async deleteMany() {
        records = [];
        return { deletedCount: 0 };
    }
}

module.exports = CustomerModel;