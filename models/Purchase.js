const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    planTitle: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    dailyEarning: { type: Number, required: true, min: 0, default: 0 },
    durationDays: { type: Number, required: true },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    creditedDays: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
