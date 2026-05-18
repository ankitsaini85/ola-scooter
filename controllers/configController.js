const AppConfig = require('../models/AppConfig');

const getPublicConfig = async (_req, res) => {
  try {
    const cfg = (await AppConfig.findOne().lean()) || {};
    res.json({
      companyName: cfg.companyName || process.env.COMPANY_NAME || 'OLA-EV scooter',
      joinChannelUrl: cfg.joinChannelUrl || process.env.JOIN_CHANNEL_URL || '#',
      serviceUrl: cfg.serviceUrl || process.env.SERVICE_URL || '#',
      heroImages: cfg.heroImages && cfg.heroImages.length ? cfg.heroImages : [process.env.HERO_IMAGE_1, process.env.HERO_IMAGE_2].filter(Boolean),
      bonusText: cfg.bonusText || process.env.DEFAULT_BONUS_TEXT || 'First-time purchase bonus 130 RS',
      dailyText: cfg.dailyText || process.env.DEFAULT_DAILY_TEXT || 'Daily earnings, daily withdrawals.',
      depositText: cfg.depositText || process.env.DEFAULT_DEPOSIT_TEXT || 'Minimum Deposit: 550 rupees',
      withdrawText: cfg.withdrawText || process.env.DEFAULT_WITHDRAW_TEXT || 'Minimum Withdrawal: 130 rupees',
      minRecharge: typeof cfg.minRecharge === 'number' ? cfg.minRecharge : Number(process.env.MIN_RECHARGE || 550),
      minWithdrawal: typeof cfg.minWithdrawal === 'number' ? cfg.minWithdrawal : Number(process.env.MIN_WITHDRAWAL || 130),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load config', error: error.message });
  }
};

const getAdminConfig = async (_req, res) => {
  try {
    const cfg = (await AppConfig.findOne().lean()) || {};
    return res.json({ config: cfg });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load admin config', error: error.message });
  }
};

const updateAdminConfig = async (req, res) => {
  try {
    const { minRecharge, minWithdrawal, companyName } = req.body;
    let cfg = await AppConfig.findOne();
    if (!cfg) cfg = new AppConfig();

    if (typeof minRecharge !== 'undefined') cfg.minRecharge = Number(minRecharge) || cfg.minRecharge;
    if (typeof minWithdrawal !== 'undefined') cfg.minWithdrawal = Number(minWithdrawal) || cfg.minWithdrawal;
    if (typeof companyName !== 'undefined') cfg.companyName = String(companyName || cfg.companyName);

    await cfg.save();
    return res.json({ message: 'Config updated', config: cfg });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update config', error: error.message });
  }
};

module.exports = {
  getPublicConfig,
  getAdminConfig,
  updateAdminConfig,
};
