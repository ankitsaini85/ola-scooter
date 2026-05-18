const Recharge = require('../models/Recharge');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { COMMISSION_RATES, getUplineUsers, toAmount } = require('../utils/referral');
const bcrypt = require('bcryptjs');
const Withdrawal = require('../models/Withdrawal');
const mongoose = require('mongoose');
const IncomeRecord = require('../models/IncomeRecord');

const AppConfig = require('../models/AppConfig');

const MIN_RECHARGE_DEFAULT = Number(process.env.MIN_RECHARGE || 550);
const MIN_WITHDRAWAL_DEFAULT = Number(process.env.MIN_WITHDRAWAL || 130);

const createRecharge = async (req, res) => {
  try {
    const { amount, channel } = req.body;
    const numeric = Number(amount);
    const cfg = (await AppConfig.findOne().lean()) || {};
    const minRecharge = typeof cfg.minRecharge === 'number' ? cfg.minRecharge : MIN_RECHARGE_DEFAULT;

    if (!numeric || numeric < minRecharge) {
      return res.status(400).json({ message: `Minimum recharge is ${minRecharge}` });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recharge = await Recharge.create({ user: user._id, amount: numeric, channel: channel || '' });

    user.totalRecharge = (user.totalRecharge || 0) + numeric;
    user.balance = (user.balance || 0) + numeric;
    await user.save();

    const commissionPayouts = [];
    const uplines = await getUplineUsers(user._id);

    for (const { level, user: uplineUser } of uplines) {
      const rate = COMMISSION_RATES[level - 1];
      if (!rate) {
        continue;
      }

      const commission = toAmount(numeric * rate);
      if (!commission) {
        continue;
      }

      uplineUser.totalIncome = (uplineUser.totalIncome || 0) + commission;
      await uplineUser.save();

      await IncomeRecord.create({
        user: uplineUser._id,
        type: 'subordinate_commission',
        amount: commission,
        level,
        sourceUser: user._id,
        note: `Level ${level} commission from recharge`,
        meta: {
          rechargeId: recharge._id,
          sourcePhone: user.phone || '',
        },
      });

      commissionPayouts.push({
        level,
        userId: uplineUser._id,
        phone: uplineUser.phone,
        amount: commission,
      });
    }

    return res.json({
      message: 'Recharge successful',
      recharge,
      commissions: commissionPayouts,
      user: { balance: user.balance, totalRecharge: user.totalRecharge },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create recharge', error: error.message });
  }
};

const listRecharges = async (req, res) => {
  try {
    const [manualRecharges, watchpayOrders] = await Promise.all([
      Recharge.find({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      Order.find({ user: req.user.id, status: 'PAID' }).sort({ createdAt: -1 }).lean(),
    ]);

    const normalizedWatchpay = watchpayOrders.map((order) => ({
      _id: order._id,
      amount: order.amount,
      channel: 'WatchPay',
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      source: 'watchpay',
      mchOrderNo: order.mchOrderNo,
    }));

    const normalizedManual = manualRecharges.map((recharge) => ({
      ...recharge,
      status: 'PAID',
      source: 'manual',
    }));

    const recharges = [...normalizedManual, ...normalizedWatchpay].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({ recharges });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load recharges', error: error.message });
  }
};

const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, password } = req.body;
    const numericAmount = toAmount(amount);
    const cfg = (await AppConfig.findOne().lean()) || {};
    const minWithdrawal = typeof cfg.minWithdrawal === 'number' ? cfg.minWithdrawal : MIN_WITHDRAWAL_DEFAULT;

    if (!numericAmount || numericAmount < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal is ${minWithdrawal}` });
    }

    if (!password) {
      return res.status(400).json({ message: 'Withdrawal password is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.withdrawalPassword);
    if (!validPassword) {
      return res.status(400).json({ message: 'Withdrawal password is incorrect' });
    }

    const bankDetailsSnapshot = {
      realName: user.bankDetails?.realName || '',
      ifsc: user.bankDetails?.ifsc || '',
      accountNumber: user.bankDetails?.accountNumber || '',
    };

    if (!bankDetailsSnapshot.realName || !bankDetailsSnapshot.ifsc || !bankDetailsSnapshot.accountNumber) {
      return res.status(400).json({ message: 'Bank details are required before withdrawal' });
    }

    // Ensure withdrawal amount does not exceed user's totalIncome
    if ((user.totalIncome || 0) < numericAmount) {
      return res.status(400).json({ message: 'Insufficient income balance' });
    }

    // Apply 10% tax on requested amount (round to 2 decimals)
    const tax = toAmount(numericAmount * 0.1);
    const payable = toAmount(numericAmount - tax);

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount: numericAmount,
      taxAmount: tax,
      payableAmount: payable,
      bankDetailsSnapshot,
      status: 'pending',
    });

    // Do not deduct income until admin approves; return requested / payable info
    return res.status(201).json({
      message: 'Withdrawal request submitted',
      withdrawal,
      user: {
        balance: user.balance,
        totalRecharge: user.totalRecharge,
        totalIncome: user.totalIncome,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create withdrawal request', error: error.message });
  }
};

const listWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({ withdrawals });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load withdrawal requests', error: error.message });
  }
};

const listAdminWithdrawals = async (_req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('user', 'phone referralCode bankDetails balance totalRecharge totalIncome role')
      .populate('processedBy', 'phone role')
      .sort({ createdAt: -1 });

    // Ensure returned objects include requested/payable/tax fields
    return res.json({ withdrawals });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load withdrawal requests', error: error.message });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, adminNote = '' } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid withdrawal status' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal request has already been processed' });
    }

    const user = await User.findById(withdrawal.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    withdrawal.status = status;
    // Only assign processedBy when req.user.id is a valid ObjectId (regular user). Admin tokens may use 'admin'.
    withdrawal.processedBy = mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null;
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = adminNote.trim();

    if (status === 'approved') {
      // Ensure user has enough income to cover approval (requested amount)
      if ((user.totalIncome || 0) < withdrawal.amount) {
        return res.status(400).json({ message: 'User has insufficient income to approve this withdrawal' });
      }

      // Debug logging to help trace unexpected deductions
      try {
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV !== 'production') console.log('Approving withdrawal:', {
          withdrawalId: withdrawal._id.toString(),
          amount: withdrawal.amount,
          userId: user._id.toString(),
          userTotalIncomeBefore: user.totalIncome,
        });
      } catch (logErr) {
        // ignore logging errors
      }

      // Deduct the requested amount from user's income wallet
      user.totalIncome = toAmount((user.totalIncome || 0) - withdrawal.amount);
      if (user.totalIncome < 0) user.totalIncome = 0;
      // Record paid amount (what will be sent to user) for clarity
      withdrawal.paidAmount = toAmount(withdrawal.payableAmount || (withdrawal.amount - (withdrawal.taxAmount || 0)));
      await user.save();

      try {
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV !== 'production') console.log('Approved withdrawal result:', {
          withdrawalId: withdrawal._id.toString(),
          userId: user._id.toString(),
          userTotalIncomeAfter: user.totalIncome,
        });
      } catch (logErr) {
        // ignore
      }
    }

    await withdrawal.save();

    const populatedWithdrawal = await Withdrawal.findById(withdrawal._id)
      .populate('user', 'phone referralCode bankDetails balance totalRecharge totalIncome role')
      .populate('processedBy', 'phone role');

    return res.json({
      message: `Withdrawal request ${status}`,
      withdrawal: populatedWithdrawal,
      user: { balance: user.balance, totalRecharge: user.totalRecharge, totalIncome: user.totalIncome },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update withdrawal request', error: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'Plan id is required' });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    if (!plan.active) {
      return res.status(400).json({ message: 'This plan is not available yet' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if ((user.balance || 0) < plan.price) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // deduct price from balance only
    user.balance = (user.balance || 0) - plan.price;
    await user.save();

    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    const purchase = await Purchase.create({
      user: user._id,
      plan: plan._id,
      planTitle: plan.title,
      price: plan.price,
      dailyEarning: plan.dailyEarning,
      durationDays: plan.durationDays,
      startsAt,
      expiresAt,
    });

    return res.json({ message: 'Plan purchased', purchase, user: { balance: user.balance } });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create purchase', error: error.message });
  }
};

const listPurchases = async (req, res) => {
  try {
    const now = new Date();

    // Keep plan status in sync: expired plans become inactive automatically.
    await Purchase.updateMany(
      {
        user: req.user.id,
        active: true,
        expiresAt: { $lte: now },
      },
      {
        $set: { active: false },
      }
    );

    const purchases = await Purchase.find({ user: req.user.id }).populate('plan').sort({ createdAt: -1 });
    return res.json({ purchases });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load purchases', error: error.message });
  }
};

const listIncomeDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance totalIncome');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const myIncomeRecords = await IncomeRecord.find({ user: req.user.id, type: 'plan_daily' })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const subordinateIncomeRecords = await IncomeRecord.find({ user: req.user.id, type: 'subordinate_commission' })
      .populate('sourceUser', 'phone')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return res.json({
      incomeStat: toAmount(user.totalIncome || 0),
      currentBalance: toAmount(user.balance || 0),
      myIncomeRecords,
      subordinateIncomeRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load income details', error: error.message });
  }
};

const listAdminUserPurchases = async (_req, res) => {
  try {
    const now = new Date();

    await Purchase.updateMany(
      {
        active: true,
        expiresAt: { $lte: now },
      },
      {
        $set: { active: false },
      }
    );

    const purchases = await Purchase.find()
      .populate('user', 'phone referralCode role')
      .populate('plan', 'title category')
      .sort({ createdAt: -1 });

    return res.json({ purchases });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user plan history', error: error.message });
  }
};

const deleteAdminUserPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'User plan record not found' });
    }

    await Purchase.deleteOne({ _id: purchase._id });

    return res.json({
      message: 'User plan deleted',
      purchaseId: purchase._id,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete user plan', error: error.message });
  }
};

module.exports = {
  createRecharge,
  listRecharges,
  createWithdrawalRequest,
  listWithdrawals,
  listAdminWithdrawals,
  updateWithdrawalStatus,
  createPurchase,
  listPurchases,
  listIncomeDetails,
  listAdminUserPurchases,
  deleteAdminUserPurchase,
};
