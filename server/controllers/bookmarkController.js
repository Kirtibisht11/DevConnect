const pool = require('../db');

// TOGGLE BOOKMARK
const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND post_id = $2',
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
        [req.user.id, id]
      );
      return res.status(200).json({ message: 'Bookmark removed', bookmarked: false });
    }

    await pool.query(
      'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)',
      [req.user.id, id]
    );

    res.status(201).json({ message: '✅ Post bookmarked!', bookmarked: true });

  } catch (error) {
    console.error('ToggleBookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL BOOKMARKS
const getBookmarks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              u.username, u.role,
              pr.full_name, pr.avatar_url, pr.headline,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count
       FROM bookmarks b
       JOIN posts p ON b.post_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN likes l ON p.id = l.post_id
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE b.user_id = $1
       GROUP BY p.id, u.username, u.role, pr.full_name, pr.avatar_url, pr.headline, b.created_at
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({ bookmarks: result.rows });

  } catch (error) {
    console.error('GetBookmarks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { toggleBookmark, getBookmarks };