const express = require('express');
const router = express.Router();
const {
  createPost, getAllPosts, getPostById, getFeed,
  updatePost, deletePost, toggleLike, addComment, getComments
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.get('/feed', protect, getFeed);
router.get('/explore', getAllPosts);
router.get('/:id', getPostById);
router.get('/:id/comments', getComments);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

module.exports = router;