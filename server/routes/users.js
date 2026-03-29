const express = require('express');
const router = express.Router();
const { getUserById, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id', getUserById);
router.put('/:id', protect, updateProfile);

module.exports = router;