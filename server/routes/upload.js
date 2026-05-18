const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadCover } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/cover', protect, upload.single('cover'), uploadCover);

module.exports = router;