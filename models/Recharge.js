const mongoose = require('mongoose');

const rechargeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    channel: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recharge', rechargeSchema);
