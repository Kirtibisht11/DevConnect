const pool = require('../db');

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, 
              u.username as sender_username,
              pr.full_name as sender_full_name,
              pr.avatar_url as sender_avatar,
              CASE 
                WHEN n.type IN ('job_follow', 'job_match', 'job_apply') THEN j.title
                ELSE NULL 
              END as job_title,
              CASE 
                WHEN n.type IN ('job_follow', 'job_match', 'job_apply') THEN j.company
                ELSE NULL 
              END as job_company
       FROM notifications n
       JOIN users u ON n.sender_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN jobs j ON n.entity_id = j.id AND n.type IN ('job_follow', 'job_match', 'job_apply')
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
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

const markOneRead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND recipient_id = $2
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unread = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE recipient_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.status(200).json({
      message: 'Notification marked as read',
      count: Number(unread.rows[0].count),
    });
  } catch (error) {
    console.error('MarkOneRead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE recipient_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.status(200).json({ count: Number(result.rows[0].count) });
  } catch (error) {
    console.error('GetUnreadNotificationCount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markAllRead, markOneRead, getUnreadCount };
