const pool = require('../db');

// GET ALL JOBS
const getAllJobs = async (req, res) => {
  try {
    const { type, experience_level } = req.query;

    let query = `
      SELECT j.*, u.username, pr.full_name, pr.avatar_url
      FROM jobs j
      JOIN users u ON j.poster_id = u.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND j.type = $${params.length}`;
    }
    if (experience_level) {
      params.push(experience_level);
      query += ` AND j.experience_level = $${params.length}`;
    }

    query += ' ORDER BY j.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ jobs: result.rows });

  } catch (error) {
    console.error('GetAllJobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE JOB
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT j.*, u.username, pr.full_name, pr.avatar_url
       FROM jobs j
       JOIN users u ON j.poster_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ job: result.rows[0] });

  } catch (error) {
    console.error('GetJobById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE JOB
const createJob = async (req, res) => {
  try {
    const {
      title, company, location, type,
      description, tech_stack, experience_level, apply_url
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO jobs
        (poster_id, title, company, location, type, description, tech_stack, experience_level, apply_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id, title, company, location, type,
        description,
        tech_stack ? JSON.stringify(tech_stack) : '[]',
        experience_level, apply_url
      ]
    );

    const job = result.rows[0];
    const jobTechStack = tech_stack || [];

    // ---- NOTIFICATION 1: Notify all followers of the poster ----
    const followers = await pool.query(
      `SELECT follower_id FROM follows WHERE following_id = $1`,
      [req.user.id]
    );

    for (const follower of followers.rows) {
      await pool.query(
        `INSERT INTO notifications (recipient_id, sender_id, type, entity_id)
         VALUES ($1, $2, 'job_follow', $3)`,
        [follower.follower_id, req.user.id, job.id]
      );
    }

    // ---- NOTIFICATION 2: Skill-match for non-followers ----
    if (jobTechStack.length > 0) {
      // Find users whose skills overlap with job tech stack
      // and who are NOT already following the poster
      const skillMatchUsers = await pool.query(
        `SELECT u.id
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.id != $1
         AND u.id NOT IN (
           SELECT follower_id FROM follows WHERE following_id = $1
         )
         AND EXISTS (
           SELECT 1 FROM jsonb_array_elements_text(p.skills) AS skill
           WHERE LOWER(skill) = ANY($2::text[])
         )`,
        [req.user.id, jobTechStack.map(s => s.toLowerCase())]
      );

      for (const match of skillMatchUsers.rows) {
        await pool.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, entity_id)
           VALUES ($1, $2, 'job_match', $3)`,
          [match.id, req.user.id, job.id]
        );
      }
    }

    res.status(201).json({ message: '✅ Job posted!', job });

  } catch (error) {
    console.error('CreateJob error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE JOB
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (existing.rows[0].poster_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
    res.status(200).json({ message: '✅ Job deleted!' });

  } catch (error) {
    console.error('DeleteJob error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllJobs, getJobById, createJob, deleteJob };