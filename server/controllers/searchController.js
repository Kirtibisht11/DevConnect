const pool = require('../db');

const search = async (req, res) => {
  try {
    const { q, type = 'users' } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    if (type === 'users') {
      const result = await pool.query(
        `SELECT u.id, u.username, pr.full_name, pr.avatar_url,
                pr.headline, pr.skills, pr.open_to_work
         FROM users u
         LEFT JOIN profiles pr ON u.id = pr.user_id
         WHERE u.username ILIKE $1
            OR pr.full_name ILIKE $1
            OR pr.headline ILIKE $1
         LIMIT 20`,
        [`%${q}%`]
      );
      return res.status(200).json({ results: result.rows, type: 'users' });
    }

    if (type === 'posts') {
      const result = await pool.query(
        `SELECT p.*, u.username, pr.full_name, pr.avatar_url
         FROM posts p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN profiles pr ON u.id = pr.user_id
         WHERE p.content ILIKE $1
         ORDER BY p.created_at DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      return res.status(200).json({ results: result.rows, type: 'posts' });
    }

    res.status(400).json({ message: 'Invalid type. Use users or posts' });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { search };