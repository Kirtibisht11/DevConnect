const pool = require('../db');

// GET ALL CONVERSATIONS (list of people you've messaged)
const getConversations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
              other_user_id,
              u.username,
              pr.full_name,
              pr.avatar_url,
              m.content as last_message,
              m.created_at as last_message_time,
              m.is_read,
              m.sender_id
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
           content, created_at, is_read, sender_id
         FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
       ) m
       JOIN users u ON u.id = m.other_user_id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY other_user_id, last_message_time DESC`,
      [req.user.id]
    );

    res.status(200).json({ conversations: result.rows });

  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MESSAGES WITH A SPECIFIC USER
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT m.*, 
              u.username as sender_username,
              pr.full_name as sender_full_name,
              pr.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.id, userId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [userId, req.user.id]
    );

    res.status(200).json({ messages: result.rows });

  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// SEND A MESSAGE
const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check receiver exists
    const receiver = await pool.query(
      'SELECT id FROM users WHERE id = $1', [userId]
    );
    if (receiver.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, userId, content.trim()]
    );

    res.status(201).json({ message: result.rows[0] });

  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET UNREAD MESSAGE COUNT
const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM messages
       WHERE receiver_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.status(200).json({ count: Number(result.rows[0].count) });

  } catch (error) {
    console.error('GetUnreadCount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getConversations, getMessages, sendMessage, getUnreadCount };