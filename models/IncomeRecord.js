const mongoose = require('mongoose');

const incomeRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['plan_daily', 'subordinate_commission'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    level: { type: Number, default: null },
    note: { type: String, default: '' },
    sourceUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
    creditDate: { type: String, default: '', index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

incomeRecordSchema.index({ user: 1, purchase: 1, type: 1, creditDate: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('IncomeRecord', incomeRecordSchema);
