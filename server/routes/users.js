const express = require('express');
const router = express.Router();
const { getUserById, updateProfile } = require('../controllers/userController');
const { toggleFollow, getFollowers, getFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

router.get('/:id', getUserById);
router.put('/:id', protect, updateProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;