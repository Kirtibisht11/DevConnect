const pool = require('../db');

// GET user by ID (public profile)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.created_at,
              p.full_name, p.bio, p.headline, p.location,
              p.avatar_url, p.cover_url, p.github_url,
              p.website_url, p.skills, p.open_to_work
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE own profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const {
      full_name, bio, headline, location,
      github_url, website_url, skills, open_to_work
    } = req.body;

    const result = await pool.query(
      `UPDATE profiles SET
        full_name = COALESCE($1, full_name),
        bio = COALESCE($2, bio),
        headline = COALESCE($3, headline),
        location = COALESCE($4, location),
        github_url = COALESCE($5, github_url),
        website_url = COALESCE($6, website_url),
        skills = COALESCE($7, skills),
        open_to_work = COALESCE($8, open_to_work),
        updated_at = NOW()
       WHERE user_id = $9
       RETURNING *`,
      [
        full_name, bio, headline, location,
        github_url, website_url,
        skills ? JSON.stringify(skills) : null,
        open_to_work, id
      ]
    );

    res.status(200).json({
      message: '✅ Profile updated successfully!',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PEOPLE YOU MAY KNOW
const getSuggestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username,
              pr.full_name, pr.avatar_url, pr.headline, pr.skills
       FROM users u
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE u.id != $1
       AND u.id NOT IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       ORDER BY RANDOM()
       LIMIT 5`,
      [req.user.id]
    );

    res.status(200).json({ suggestions: result.rows });

  } catch (error) {
    console.error('GetSuggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUserById, updateProfile, getSuggestions };