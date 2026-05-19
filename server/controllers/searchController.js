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
                pr.headline, pr.skills, pr.open_to_work, pr.location
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

    if (type === 'jobs') {
      const result = await pool.query(
        `SELECT j.*, u.username, pr.full_name
         FROM jobs j
         JOIN users u ON j.poster_id = u.id
         LEFT JOIN profiles pr ON u.id = pr.user_id
         WHERE j.title ILIKE $1
            OR j.company ILIKE $1
            OR j.description ILIKE $1
            OR j.location ILIKE $1
         ORDER BY j.created_at DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      return res.status(200).json({ results: result.rows, type: 'jobs' });
    }

    res.status(400).json({ message: 'Invalid type. Use users, posts, or jobs' });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { search };