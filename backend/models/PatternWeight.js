const mongoose = require('mongoose');

// Tracks how "real" each mismatch type has turned out to be, based on user
// feedback (Confirm / False Positive in the dashboard). This is the
// "Continuous Feedback Loop" from slide 3: every confirmed mismatch nudges
// the weight up (raise future risk scores of that type, i.e. trust it more),
// every false positive nudges it down.
const PatternWeightSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    weight: { type: Number, default: 1.0, min: 0.2, max: 2.0 },
    timesConfirmed: { type: Number, default: 0 },
    timesRejected: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatternWeight', PatternWeightSchema);
