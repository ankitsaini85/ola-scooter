const express = require('express');
const { createPlan, deletePlan, listPlans, updatePlan } = require('../controllers/planController');
const {
	listAdminWithdrawals,
	updateWithdrawalStatus,
	listAdminUserPurchases,
	deleteAdminUserPurchase,
} = require('../controllers/transactionController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getAdminConfig, updateAdminConfig } = require('../controllers/configController');

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/plans', listPlans);
router.post('/plans', upload.single('image'), createPlan);
router.patch('/plans/:id', upload.single('image'), updatePlan);
router.delete('/plans/:id', deletePlan);
router.get('/withdrawals', listAdminWithdrawals);
router.patch('/withdrawals/:id', updateWithdrawalStatus);
router.get('/user-plans', listAdminUserPurchases);
router.delete('/user-plans/:id', deleteAdminUserPurchase);
router.get('/config', getAdminConfig);
router.patch('/config', updateAdminConfig);

module.exports = router;
