const pool = require('../db');

// CREATE POST
const createPost = async (req, res) => {
  try {
    const { content, code_snippet, language, image_url } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, code_snippet, language, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, content, code_snippet || null, language || null, image_url || null]
    );

    res.status(201).json({
      message: '✅ Post created!',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('CreatePost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL POSTS (explore feed)
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*,
              u.username, u.role,
              pr.full_name, pr.avatar_url, pr.headline,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       GROUP BY p.id, u.username, u.role, pr.full_name, pr.avatar_url, pr.headline
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json({
      posts: result.rows,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (error) {
    console.error('GetAllPosts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE POST
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
              u.username, u.role,
              pr.full_name, pr.avatar_url, pr.headline,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE p.id = $1
       GROUP BY p.id, u.username, u.role, pr.full_name, pr.avatar_url, pr.headline`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({ post: result.rows[0] });

  } catch (error) {
    console.error('GetPostById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FEED (posts from followed users)
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*,
              u.username, u.role,
              pr.full_name, pr.avatar_url, pr.headline,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE p.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       ) OR p.user_id = $1
       GROUP BY p.id, u.username, u.role, pr.full_name, pr.avatar_url, pr.headline
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.status(200).json({
      posts: result.rows,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (error) {
    console.error('GetFeed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE POST
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, code_snippet, language } = req.body;

    const existing = await pool.query(
      'SELECT * FROM posts WHERE id = $1', [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const result = await pool.query(
      `UPDATE posts SET
        content = COALESCE($1, content),
        code_snippet = COALESCE($2, code_snippet),
        language = COALESCE($3, language),
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [content, code_snippet, language, id]
    );

    res.status(200).json({
      message: '✅ Post updated!',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('UpdatePost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM posts WHERE id = $1', [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.status(200).json({ message: '✅ Post deleted!' });

  } catch (error) {
    console.error('DeletePost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// LIKE / UNLIKE POST
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    // Get post to find owner
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      return res.status(200).json({ message: 'Post unliked', liked: false });
    }

    await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
      [id, req.user.id]
    );

    // Create notification (only if liker is not the post owner)
    if (post.rows[0].user_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (recipient_id, sender_id, type, entity_id)
         VALUES ($1, $2, 'like', $3)`,
        [post.rows[0].user_id, req.user.id, id]
      );
    }

    res.status(201).json({ message: '✅ Post liked!', liked: true });

  } catch (error) {
    console.error('ToggleLike error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Get post to find owner
    const post = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, content]
    );

    // Create notification (only if commenter is not the post owner)
    if (post.rows[0].user_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (recipient_id, sender_id, type, entity_id)
         VALUES ($1, $2, 'comment', $3)`,
        [post.rows[0].user_id, req.user.id, id]
      );
    }

    res.status(201).json({
      message: '✅ Comment added!',
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('AddComment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET COMMENTS FOR A POST
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.username, pr.full_name, pr.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.status(200).json({ comments: result.rows });

  } catch (error) {
    console.error('GetComments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost, getAllPosts, getPostById, getFeed,
  updatePost, deletePost, toggleLike, addComment, getComments
};