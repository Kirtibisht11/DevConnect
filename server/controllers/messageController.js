const pool = require('../db');

let ensureAttachmentColumnsPromise;

const ensureAttachmentColumns = () => {
  if (!ensureAttachmentColumnsPromise) {
    ensureAttachmentColumnsPromise = pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS attachment_size INTEGER
    `);
  }

  return ensureAttachmentColumnsPromise;
};

// GET ALL CONVERSATIONS (list of people you've messaged)
const getConversations = async (req, res) => {
  try {
    await ensureAttachmentColumns();

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
              other_user_id,
              u.username,
              pr.full_name,
              pr.avatar_url,
              m.content as last_message,
              m.attachment_name as last_attachment_name,
              m.attachment_type as last_attachment_type,
              m.created_at as last_message_time,
              m.is_read,
              m.sender_id,
              (
                SELECT COUNT(*)
                FROM messages unread
                WHERE unread.sender_id = m.other_user_id
                  AND unread.receiver_id = $1
                  AND unread.is_read = false
              ) as unread_count
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
           content, attachment_name, attachment_type, created_at, is_read, sender_id
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
    await ensureAttachmentColumns();

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
    await ensureAttachmentColumns();

    const { userId } = req.params;
    const { content, attachment_url, attachment_type, attachment_name, attachment_size } = req.body;
    const messageText = content?.trim() || '';

    if (!messageText && !attachment_url) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    // Check receiver exists
    const receiver = await pool.query(
      'SELECT id FROM users WHERE id = $1', [userId]
    );
    if (receiver.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await pool.query(
      `INSERT INTO messages (
         sender_id, receiver_id, content,
         attachment_url, attachment_type, attachment_name, attachment_size
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        userId,
        messageText,
        attachment_url || null,
        attachment_type || null,
        attachment_name || null,
        attachment_size || null,
      ]
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
    await ensureAttachmentColumns();

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
