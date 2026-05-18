const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    withdrawalPassword: {
      type: String,
      required: true,
    },
    bankDetails: {
      realName: {
        type: String,
        default: '',
      },
      ifsc: {
        type: String,
        default: '',
      },
      accountNumber: {
        type: String,
        default: '',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRecharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
