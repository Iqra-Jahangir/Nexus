const Message = require('../models/Message');

// GET /api/messages/:userId — get messages between two users
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    // mark messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// POST /api/messages — save a message
const saveMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
};

// GET /api/messages/conversations — get all conversations for current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    const conversationMap = new Map();
    messages.forEach(msg => {
      const otherId = msg.senderId._id.toString() === userId
        ? msg.receiverId._id.toString()
        : msg.senderId._id.toString();

      if (!conversationMap.has(otherId)) {
        const otherUser = msg.senderId._id.toString() === userId
          ? msg.receiverId
          : msg.senderId;
        conversationMap.set(otherId, {
          userId: otherId,
          name: otherUser.name,
          email: otherUser.email,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          isRead: msg.isRead,
          senderId: msg.senderId._id.toString(),
        });
      }
    });

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

module.exports = { getMessages, saveMessage, getConversations };