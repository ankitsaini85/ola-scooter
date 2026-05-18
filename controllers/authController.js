const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getTeamLevels } = require('../utils/referral');

const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

const getDisplayBalance = (user) => {
  const balance = Number(user.balance || 0);
  const totalRecharge = Number(user.totalRecharge || 0);
  const totalIncome = Number(user.totalIncome || 0);

  if (totalIncome > 0 && balance === totalRecharge + totalIncome) {
    return totalRecharge;
  }

  return balance;
};

const serializeUser = (user) => ({
  id: user._id,
  phone: user.phone,
  role: user.role,
  referralCode: user.referralCode,
  referredBy: user.referredBy || null,
  bankDetails: {
    realName: user.bankDetails?.realName || '',
    ifsc: user.bankDetails?.ifsc || '',
    accountNumber: user.bankDetails?.accountNumber || '',
  },
  balance: getDisplayBalance(user),
  totalRecharge: user.totalRecharge || 0,
  totalIncome: user.totalIncome || 0,
});

const buildUserResponse = (user, token) => ({
  token,
  user: serializeUser(user),
});

const registerUser = async (req, res) => {
  try {
    const { phone, password, confirmPassword, withdrawalPassword, referralCode } = req.body;

    if (!phone || !password || !confirmPassword || !withdrawalPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedWithdrawalPassword = await bcrypt.hash(withdrawalPassword, 10);

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.trim() }).select('_id');
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referredBy = referrer._id;
    }

    let user = await User.create({
      phone,
      password: hashedPassword,
      withdrawalPassword: hashedWithdrawalPassword,
      referredBy,
    });

    // derive a short referral code from the user id
    const generatedReferralCode = user._id.toString().slice(-8);
    user = await User.findByIdAndUpdate(user._id, { referralCode: generatedReferralCode }, { new: true });

    const token = createToken({ id: user._id, phone: user.phone, role: user.role });
    return res.status(201).json(buildUserResponse(user, token));
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken({ id: user._id, phone: user.phone, role: user.role });
    return res.json(buildUserResponse(user, token));
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = createToken({ id: 'admin', email, role: 'admin' });
    return res.json({
      token,
      user: {
        id: 'admin',
        email,
        role: 'admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Admin login failed', error: error.message });
  }
};

const me = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        user: {
          id: 'admin',
          role: 'admin',
          email: process.env.ADMIN_EMAIL,
        },
      });
    }

    const user = await User.findById(req.user.id).select('-password -withdrawalPassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load profile', error: error.message });
  }
};

const updateBankDetails = async (req, res) => {
  try {
    const { realName = '', ifsc = '', accountNumber = '' } = req.body;

    if (!realName.trim() || !ifsc.trim() || !accountNumber.trim()) {
      return res.status(400).json({ message: 'All bank detail fields are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        bankDetails: {
          realName: realName.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          accountNumber: accountNumber.trim(),
        },
      },
      { new: true }
    ).select('-password -withdrawalPassword');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'Bank details updated', user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update bank details', error: error.message });
  }
};

const updateLoginPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update password', error: error.message });
  }
};

const updateWithdrawalPassword = async (req, res) => {
  try {
    const { oldWithdrawalPassword, newWithdrawalPassword, confirmNewWithdrawalPassword } = req.body;

    if (!oldWithdrawalPassword || !newWithdrawalPassword || !confirmNewWithdrawalPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newWithdrawalPassword !== confirmNewWithdrawalPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldWithdrawalPassword, user.withdrawalPassword);
    if (!validPassword) {
      return res.status(400).json({ message: 'Old withdrawal password is incorrect' });
    }

    user.withdrawalPassword = await bcrypt.hash(newWithdrawalPassword, 10);
    await user.save();

    return res.json({ message: 'Withdrawal password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update withdrawal password', error: error.message });
  }
};

const getTeamSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const team = await getTeamLevels(user._id);
    return res.json(team);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load team summary', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  me,
  updateBankDetails,
  updateLoginPassword,
  updateWithdrawalPassword,
  getTeamSummary,
};
