const express = require('express');
const router = express.Router();
const {
  getConversations, getMessages, sendMessage, getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getConversations);
router.get('/unread', protect, getUnreadCount);
router.get('/:userId', protect, getMessages);
router.post('/:userId', protect, sendMessage);

module.exports = router;