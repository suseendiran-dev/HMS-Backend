const Message = require('../models/Message');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      content,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations
const getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .sort({ createdAt: -1 });

    const conversations = {};
    messages.forEach((message) => {
      const otherUser = message.sender._id.toString() === req.user._id.toString()
        ? message.receiver
        : message.sender;
      
      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: message,
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { receiver: req.user._id, sender: req.params.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations, markAsRead };
