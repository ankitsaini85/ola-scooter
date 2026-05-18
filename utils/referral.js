const User = require('../models/User');

const COMMISSION_RATES = [0.25, 0.03, 0.02];

const toAmount = (value) => Number(Number(value || 0).toFixed(2));

const getUplineUsers = async (userId, maxDepth = COMMISSION_RATES.length) => {
  const uplines = [];
  let currentUser = await User.findById(userId).select('referredBy phone referralCode totalRecharge totalIncome balance createdAt');

  for (let level = 0; level < maxDepth; level += 1) {
    if (!currentUser?.referredBy) {
      break;
    }

    const parent = await User.findById(currentUser.referredBy).select('referredBy phone referralCode totalRecharge totalIncome balance createdAt');
    if (!parent) {
      break;
    }

    uplines.push({ level: level + 1, user: parent });
    currentUser = parent;
  }

  return uplines;
};

const getTeamLevels = async (userId, maxDepth = COMMISSION_RATES.length) => {
  const levels = [];
  let parentIds = [userId];

  for (let level = 1; level <= maxDepth; level += 1) {
    const members = await User.find({ referredBy: { $in: parentIds } })
      .select('phone referralCode referredBy totalRecharge totalIncome balance createdAt')
      .sort({ totalRecharge: -1, createdAt: 1 });

    const mappedMembers = members.map((member) => ({
      id: member._id,
      phone: member.phone,
      referralCode: member.referralCode || '',
      totalRecharge: member.totalRecharge || 0,
      totalIncome: member.totalIncome || 0,
      balance: member.balance || 0,
      joinedAt: member.createdAt,
    }));

    const totalRecharge = mappedMembers.reduce((sum, member) => sum + toAmount(member.totalRecharge), 0);

    levels.push({
      level,
      rate: COMMISSION_RATES[level - 1],
      count: mappedMembers.length,
      totalRecharge: toAmount(totalRecharge),
      members: mappedMembers,
    });

    parentIds = members.map((member) => member._id);
    if (!parentIds.length) {
      break;
    }
  }

  const teamSize = levels.reduce((sum, level) => sum + level.count, 0);
  const teamRecharge = levels.reduce((sum, level) => sum + level.totalRecharge, 0);

  return {
    teamSize,
    teamRecharge: toAmount(teamRecharge),
    levels,
  };
};

module.exports = {
  COMMISSION_RATES,
  getTeamLevels,
  getUplineUsers,
  toAmount,
};