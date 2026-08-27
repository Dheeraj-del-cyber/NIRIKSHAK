const { v4: uuidv4 } = require('uuid');

let records = [];

class PatternWeightInstance {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) this._id = uuidv4();
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const idx = records.findIndex(r => r._id === this._id);
    if (idx >= 0) {
      records[idx] = this;
    } else {
      records.push(this);
    }
    return this;
  }
}

class PatternWeightModel {
  static find(filter = {}) {
    let result = records;
    const query = {
      lean: () => {
        return query;
      },
      then: (resolve, reject) => {
        resolve(result);
      }
    };
    return query;
  }

  static async findOne(filter = {}) {
    const found = records.find(r => r.type === filter.type);
    return found ? found : null;
  }

  static async create(data) {
    const instance = new PatternWeightInstance({ ...data, weight: 1.0 });
    records.push(instance);
    return instance;
  }

  static async updateOne(filter, update, options = {}) {
    const found = records.find(r => r.type === filter.type);
    if (found) {
      // Very basic mock of update
    } else if (options.upsert) {
      const type = update.$setOnInsert ? update.$setOnInsert.type : filter.type;
      const instance = new PatternWeightInstance({ type, weight: 1.0 });
      records.push(instance);
    }
    return { acknowledged: true };
  }

  static async deleteMany(filter = {}) {
    records = [];
    return { deletedCount: 0 };
  }
}

module.exports = PatternWeightModel;
