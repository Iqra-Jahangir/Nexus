const express = require('express');
const router = express.Router();
const { createPayment, getHistory } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

router.post('/create', auth, createPayment);
router.get('/history', auth, getHistory);

module.exports = router;