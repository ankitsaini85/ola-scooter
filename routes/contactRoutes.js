const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createContactMessage, listAdminContactMessages } = require('../controllers/contactController');

const router = express.Router();

router.post('/', authenticate, createContactMessage);
router.get('/admin', authenticate, requireAdmin, listAdminContactMessages);

module.exports = router;