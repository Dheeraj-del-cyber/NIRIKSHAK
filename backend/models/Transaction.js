const { v4: uuidv4 } = require('uuid');

// A billing transaction line: a sale, a discount applied to a sale, or a
// refund against a sale. Powers unusual-discount / unusual-refund detection.
let records = [];

class TransactionModel {
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

module.exports = TransactionModel;