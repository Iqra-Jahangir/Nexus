const Transaction = require('../models/Transaction');

// POST /api/payments/create
const createPayment = async (req, res) => {
  try {
    const { amount, type, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // simulate processing delay
    const transaction = new Transaction({
      user: req.user.id,
      type: type || 'deposit',
      amount,
      status: 'Completed', // mock — instantly completes
      stripePaymentId: `mock_${Date.now()}`,
      description: description || '',
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/payments/history
const getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPayment, getHistory };