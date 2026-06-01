const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/:id', auth, getProfile);
router.put('/:id', auth, updateProfile);

module.exports = router;