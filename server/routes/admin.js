const express = require('express');
const router = express.Router();
const { getStats, deleteUser, deletePost } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, getStats);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.delete('/posts/:id', protect, adminOnly, deletePost);

module.exports = router;