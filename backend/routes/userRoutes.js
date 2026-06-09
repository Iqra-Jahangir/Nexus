const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserByEmail, getEntrepreneurs } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/role/entrepreneur', auth, getEntrepreneurs);
router.get('/email/:email', auth, getUserByEmail);
router.get('/:id', auth, getProfile);
router.put('/:id', auth, updateProfile);

module.exports = router;