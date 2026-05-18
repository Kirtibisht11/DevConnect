const pool = require('../db');

const getStats = async (req, res) => {
  try {
    const [users, posts, comments, likes, jobs, messages] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM posts'),
      pool.query('SELECT COUNT(*) FROM comments'),
      pool.query('SELECT COUNT(*) FROM likes'),
      pool.query('SELECT COUNT(*) FROM jobs'),
      pool.query('SELECT COUNT(*) FROM messages'),
    ]);

    const recentUsers = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              p.full_name, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC
       LIMIT 10`
    );

    const recentPosts = await pool.query(
      `SELECT p.*, u.username, pr.full_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    res.status(200).json({
      stats: {
        users: Number(users.rows[0].count),
        posts: Number(posts.rows[0].count),
        comments: Number(comments.rows[0].count),
        likes: Number(likes.rows[0].count),
        jobs: Number(jobs.rows[0].count),
        messages: Number(messages.rows[0].count),
      },
      recentUsers: recentUsers.rows,
      recentPosts: recentPosts.rows,
    });

  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: "Can't delete your own account" });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ message: '✅ User deleted' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.status(200).json({ message: '✅ Post deleted' });
  } catch (error) {
    console.error('AdminDeletePost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, deleteUser, deletePost };