const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: process.env.COMPANY_NAME || 'OLA-EV scooter' },
    joinChannelUrl: { type: String, default: process.env.JOIN_CHANNEL_URL || '#' },
    serviceUrl: { type: String, default: process.env.SERVICE_URL || '#' },
    heroImages: { type: [String], default: [] },
    bonusText: { type: String, default: process.env.DEFAULT_BONUS_TEXT || 'First-time purchase bonus 130 RS' },
    dailyText: { type: String, default: process.env.DEFAULT_DAILY_TEXT || 'Daily earnings, daily withdrawals.' },
    depositText: { type: String, default: process.env.DEFAULT_DEPOSIT_TEXT || 'Minimum Deposit: 550 rupees' },
    withdrawText: { type: String, default: process.env.DEFAULT_WITHDRAW_TEXT || 'Minimum Withdrawal: 130 rupees' },
    minRecharge: { type: Number, default: Number(process.env.MIN_RECHARGE || 550) },
    minWithdrawal: { type: Number, default: Number(process.env.MIN_WITHDRAWAL || 130) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);
