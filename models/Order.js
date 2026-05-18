const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    mchOrderNo: { type: String, required: true, index: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING', index: true },
    respData: { type: mongoose.Schema.Types.Mixed, default: null },
    gatewayOrderNo: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
