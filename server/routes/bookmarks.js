const express = require('express');
const router = express.Router();
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getBookmarks);
router.post('/:id', protect, toggleBookmark);

module.exports = router;