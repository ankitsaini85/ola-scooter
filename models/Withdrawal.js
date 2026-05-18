const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // `amount` kept for backwards-compat: store requestedAmount here
    amount: { type: Number, required: true, min: 0 },
    // Detailed amounts
    taxAmount: { type: Number, default: 0 },
    payableAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    bankDetailsSnapshot: {
      realName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
    },
    adminNote: { type: String, default: '' },
    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);