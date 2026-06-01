const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

// protected test routes
router.get('/investor-only', auth, requireRole('investor'), (req, res) => {
  res.json({ message: 'Welcome investor!', user: req.user });
});

router.get('/entrepreneur-only', auth, requireRole('entrepreneur'), (req, res) => {
  res.json({ message: 'Welcome entrepreneur!', user: req.user });
});

module.exports = router;