const { v4: uuidv4 } = require('uuid');

let records = [];

class GSTRecordModel {
  static find(filter = {}) {
    let result = records;
    if (filter['validation.isValid'] !== undefined) {
      result = result.filter(r => r.validation?.isValid === filter['validation.isValid']);
    }

    const query = {
      sort: (sortObj) => {
        result = [...result].reverse();
        return query;
      },
      limit: (n) => {
        result = result.slice(0, n);
        return query;
      },
      lean: () => {
        return query;
      },
      then: (resolve, reject) => {
        resolve(result);
      }
    };
    return query;
  }

  static async insertMany(docs) {
    const toInsert = docs.map(d => ({ ...d, _id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }));
    records.push(...toInsert);
    return toInsert;
  }

  static async deleteMany(filter = {}) {
    records = [];
    return { deletedCount: records.length };
  }
}

module.exports = GSTRecordModel;
