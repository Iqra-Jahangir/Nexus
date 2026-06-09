const express = require('express');
const router = express.Router();
const { getMessages, saveMessage, getConversations } = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, getConversations);
router.get('/:userId', auth, getMessages);
router.post('/', auth, saveMessage);

module.exports = router;