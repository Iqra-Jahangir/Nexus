const jwt = require('jsonwebtoken');

// verifies JWT token on protected routes
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// protects routes based on role
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden - wrong role' });
  }
  next();
};

module.exports = { auth, requireRole };