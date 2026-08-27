const { v4: uuidv4 } = require('uuid');

// A recovery workflow is what the Autonomous Recovery Agent produces for
// every open leak it simulates: the projected recoverable amount, the
// probability the recovery action actually succeeds, whether the agent
// judged that confident enough to self-initiate, and the step-by-step
// action trail (auto-started for high-confidence cases, queued for human
// review otherwise).

const DECISIONS = ['auto_initiated', 'needs_review'];
const STATUSES = ['in_progress', 'pending_review', 'recovered', 'failed', 'cancelled'];

let records = [];

class RecoveryWorkflowInstance {
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

class RecoveryWorkflowModel {
    static find(filter = {}) {
        let result = records;
        if (filter.decision) result = result.filter((r) => r.decision === filter.decision);
        if (filter.status) result = result.filter((r) => r.status === filter.status);
        if (filter.leakType) result = result.filter((r) => r.leakType === filter.leakType);
        if (filter.sourceType) result = result.filter((r) => r.sourceType === filter.sourceType);

        const query = {
            sort: (sortObj) => {
                if (sortObj) {
                    const [[key, dir]] = Object.entries(sortObj);
                    result = [...result].sort((a, b) => ((b[key] || 0) - (a[key] || 0)) * (dir === -1 ? 1 : -1));
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
        const instances = docs.map((d) => new RecoveryWorkflowInstance(d));
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

module.exports = RecoveryWorkflowModel;
module.exports.DECISIONS = DECISIONS;
module.exports.STATUSES = STATUSES;
