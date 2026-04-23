const pool = require('../db');

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.username as sender_username
       FROM notifications n
       JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.status(200).json({ notifications: result.rows });
  } catch (error) {
    console.error('GetNotifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1',
      [req.user.id]
    );
    res.status(200).json({ message: '✅ All notifications marked as read' });
  } catch (error) {
    console.error('MarkAllRead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markAllRead };