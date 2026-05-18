const express = require('express');
const { listPlans } = require('../controllers/planController');

const router = express.Router();

router.get('/', listPlans);

module.exports = router;
