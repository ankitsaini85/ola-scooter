const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
	createRecharge,
	listRecharges,
	createWithdrawalRequest,
	listWithdrawals,
	createPurchase,
	listPurchases,
	listIncomeDetails,
} = require('../controllers/transactionController');

const router = express.Router();

router.post('/recharge', authenticate, createRecharge);
router.get('/recharges', authenticate, listRecharges);

router.post('/withdrawals', authenticate, createWithdrawalRequest);
router.get('/withdrawals', authenticate, listWithdrawals);

router.post('/purchase', authenticate, createPurchase);
router.get('/purchases', authenticate, listPurchases);
router.get('/income-details', authenticate, listIncomeDetails);

module.exports = router;
