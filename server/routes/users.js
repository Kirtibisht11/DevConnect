const express = require('express');
const router = express.Router();
const { getUserById, updateProfile } = require('../controllers/userController');
const { toggleFollow, getFollowers, getFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/auth');
const { getUserById, updateProfile, getSuggestions } = require('../controllers/userController');
router.get('/:id', getUserById);
router.put('/:id', protect, updateProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/suggestions', protect, getSuggestions);

module.exports = router;