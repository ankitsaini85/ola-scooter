const Purchase = require('../models/Purchase');
const User = require('../models/User');
const IncomeRecord = require('../models/IncomeRecord');
const { toAmount } = require('../utils/referral');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const daysBetweenUtc = (startDate, endDate) => {
  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.floor((endUtc - startUtc) / MS_PER_DAY);
};

const runDailyIncomeCredit = async () => {
  const now = new Date();
  const todayKey = dateKey(now);

  const purchases = await Purchase.find({ active: true }).populate('plan').sort({ startsAt: 1 });
  for (const purchase of purchases) {
    // If the referenced Plan no longer exists (deleted by admin), mark purchase inactive and skip
    if (!purchase.plan) {
      try {
        purchase.active = false;
        await purchase.save();
      } catch (err) {
        // ignore save errors
      }
      continue;
    }
    const startsAt = new Date(purchase.startsAt);
    // Credit one entry per fully elapsed day since purchase start date.
    const daysElapsed = daysBetweenUtc(startsAt, now);
    const maxEligibleDays = Math.min(Math.max(daysElapsed, 0), purchase.durationDays);

    if (maxEligibleDays <= (purchase.creditedDays || 0)) {
      if (maxEligibleDays >= purchase.durationDays && purchase.active) {
        purchase.active = false;
        await purchase.save();
      }
      continue;
    }

    const user = await User.findById(purchase.user);
    if (!user) {
      continue;
    }

    let creditedCount = 0;

    for (let dayIndex = purchase.creditedDays || 0; dayIndex < maxEligibleDays; dayIndex += 1) {
      // Day 0 credits on the next calendar day, not the purchase day.
      const creditDate = new Date(startsAt.getTime() + (dayIndex + 1) * MS_PER_DAY);
      const creditKey = dateKey(creditDate);

      if (creditKey > todayKey) {
        break;
      }

      try {
        await IncomeRecord.create({
          user: user._id,
          type: 'plan_daily',
          amount: toAmount(purchase.dailyEarning || 0),
          purchase: purchase._id,
          creditDate: creditKey,
          note: `Daily plan income (${purchase.planTitle || 'Plan'})`,
          meta: {
            planId: purchase.plan,
            planTitle: purchase.planTitle || '',
            dayNumber: dayIndex + 1,
            durationDays: purchase.durationDays,
          },
        });

        user.totalIncome = toAmount((user.totalIncome || 0) + (purchase.dailyEarning || 0));
        creditedCount += 1;
      } catch (error) {
        // Duplicate income records are ignored to keep job idempotent.
        if (error?.code !== 11000) {
          // eslint-disable-next-line no-console
          console.error('Daily income credit failed', error.message);
        }
      }
    }

    if (creditedCount > 0) {
      await user.save();
      purchase.creditedDays = (purchase.creditedDays || 0) + creditedCount;
    } else {
      purchase.creditedDays = Math.max(purchase.creditedDays || 0, maxEligibleDays);
    }

    if (purchase.creditedDays >= purchase.durationDays) {
      purchase.active = false;
    }

    await purchase.save();
  }
};

const shouldRunNow = (now) => now.getHours() === 0 && now.getMinutes() >= 2;

const startDailyIncomeScheduler = () => {
  let lastRunKey = '';

  const tick = async () => {
    const now = new Date();
    const runKey = dateKey(now);
    if (!shouldRunNow(now) || runKey === lastRunKey) {
      return;
    }

    lastRunKey = runKey;
    try {
      await runDailyIncomeCredit();
      // eslint-disable-next-line no-console
      console.log(`Daily income credit completed for ${runKey}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Daily income scheduler failed', error.message);
    }
  };

  setInterval(() => {
    tick();
  }, 60 * 1000);

  // catch-up on startup for missed days
  runDailyIncomeCredit().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Initial daily income catch-up failed', error.message);
  });
};

module.exports = {
  runDailyIncomeCredit,
  startDailyIncomeScheduler,
};
