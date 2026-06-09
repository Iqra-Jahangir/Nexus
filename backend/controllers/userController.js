const User = require('../models/User');

// GET /api/users/:id — fetch profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/users/:id — update profile
const updateProfile = async (req, res) => {
  try {
    const { name, profileData } = req.body;

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, profileData },
      { new: true }
    ).select('-passwordHash');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/email/:email — find user by email
const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/role/entrepreneur — get all entrepreneurs
const getEntrepreneurs = async (req, res) => {
  try {
    const users = await User.find({ role: 'entrepreneur' }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getUserByEmail, getEntrepreneurs };