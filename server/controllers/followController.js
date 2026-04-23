const pool = require('../db');

// FOLLOW / UNFOLLOW
const toggleFollow = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;

    if (id === followerId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const user = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existing = await pool.query(
      'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, id]
      );
      return res.status(200).json({ message: 'Unfollowed', following: false });
    }

    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, id]
    );

    // Create follow notification
    await pool.query(
      `INSERT INTO notifications (recipient_id, sender_id, type)
       VALUES ($1, $2, 'follow')`,
      [id, followerId]
    );

    res.status(201).json({ message: '✅ Following!', following: true });

  } catch (error) {
    console.error('ToggleFollow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FOLLOWERS
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, pr.full_name, pr.avatar_url, pr.headline
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE f.following_id = $1`,
      [id]
    );

    res.status(200).json({ followers: result.rows, count: result.rows.length });

  } catch (error) {
    console.error('GetFollowers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET FOLLOWING
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, pr.full_name, pr.avatar_url, pr.headline
       FROM follows f
       JOIN users u ON f.following_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE f.follower_id = $1`,
      [id]
    );

    res.status(200).json({ following: result.rows, count: result.rows.length });

  } catch (error) {
    console.error('GetFollowing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { toggleFollow, getFollowers, getFollowing };