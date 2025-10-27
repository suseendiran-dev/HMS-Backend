const express = require('express');
const {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
