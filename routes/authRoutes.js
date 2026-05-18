const express = require('express');
const {
	loginAdmin,
	loginUser,
	me,
	registerUser,
	updateBankDetails,
	updateLoginPassword,
	updateWithdrawalPassword,
	getTeamSummary,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.get('/me', authenticate, me);
router.get('/team', authenticate, getTeamSummary);
router.put('/bank-details', authenticate, updateBankDetails);
router.put('/password', authenticate, updateLoginPassword);
router.put('/withdrawal-password', authenticate, updateWithdrawalPassword);

module.exports = router;
