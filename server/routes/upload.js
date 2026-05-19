const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadCover, uploadPostImage, uploadMessageAttachment, uploadResume } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload, uploadAny } = require('../config/cloudinary');

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/cover', protect, upload.single('cover'), uploadCover);
router.post('/post-image', protect, upload.single('image'), uploadPostImage);
router.post('/message-attachment', protect, uploadAny.single('attachment'), uploadMessageAttachment);
router.post('/resume', protect, uploadAny.single('resume'), uploadResume);

module.exports = router;
