const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const User = require('./models/User');
const Plan = require('./models/Plan');
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getPublicConfig } = require('./controllers/configController');
const bcrypt = require('bcryptjs');
const { startDailyIncomeScheduler } = require('./jobs/dailyIncomeJob');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL?.split(',') || ['http://olascooter.info', 'http://www.olascooter.info', 'https://olascooter.info', 'https://www.olascooter.info', 'www.olascooter.info', 'olascooter.info'];

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/config', getPublicConfig);
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);

const seedPlans = async () => {
  const count = await Plan.countDocuments();
  if (count > 0) {
    return;
  }

  await Plan.insertMany([
    {
      title: 'Plan A',
      category: 'day',
      imageUrl: process.env.PLAN_IMAGE_A || process.env.HERO_IMAGE_1 || 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=900&q=80',
      price: 550,
      dailyEarning: 130,
      durationDays: 180,
      totalEarning: 23400,
      badgeLabel: 'Plan A',
      order: 1,
    },
    {
      title: 'Plan B',
      category: 'vip',
      imageUrl: process.env.PLAN_IMAGE_B || process.env.HERO_IMAGE_2 || 'https://images.unsplash.com/photo-1514361892635-eae31fe5e8ec?auto=format&fit=crop&w=900&q=80',
      price: 2000,
      dailyEarning: 750,
      durationDays: 180,
      totalEarning: 135000,
      badgeLabel: 'Plan B',
      order: 2,
    },
  ]);
};

const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminWithdrawalPassword = process.env.ADMIN_WITHDRAWAL_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || !adminWithdrawalPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ phone: adminEmail, role: 'admin' });
  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const hashedWithdrawalPassword = await bcrypt.hash(adminWithdrawalPassword, 10);
  await User.create({
    phone: adminEmail,
    password: hashedPassword,
    withdrawalPassword: hashedWithdrawalPassword,
    role: 'admin',
  });
};

const startServer = async () => {
  await connectDB();
  await seedPlans();
  await seedAdminUser();
  startDailyIncomeScheduler();
  // Ensure AppConfig exists with sensible defaults (minWithdrawal default set to 300)
  try {
    const AppConfig = require('./models/AppConfig');
    const existing = await AppConfig.findOne();
    if (!existing) {
      await AppConfig.create({
        minRecharge: Number(process.env.MIN_RECHARGE || 550),
        minWithdrawal: Number(process.env.MIN_WITHDRAWAL || 300),
        companyName: process.env.COMPANY_NAME || 'OLA-EV scooter',
      });
    } else {
      // If existing config has an old default name, update it to the current env/company name
      const currentBrand = process.env.COMPANY_NAME || 'OLA-EV scooter';
      if (existing.companyName && ['Electric Vehicle', 'Corona'].includes(existing.companyName)) {
        existing.companyName = currentBrand;
        try {
          await existing.save();
        } catch (err) {
          console.warn('Unable to update existing AppConfig companyName', err.message);
        }
      }
    }
  } catch (err) {
    console.warn('Unable to ensure AppConfig', err.message);
  }

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
