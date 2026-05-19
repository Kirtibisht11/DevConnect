const pool = require('../db');

let ensureApplicationsTablePromise;

const ensureApplicationsTable = () => {
  if (!ensureApplicationsTablePromise) {
    ensureApplicationsTablePromise = pool.query(`
      DO $$
      DECLARE
        job_id_type TEXT;
        user_id_type TEXT;
      BEGIN
        SELECT format_type(a.atttypid, a.atttypmod)
        INTO job_id_type
        FROM pg_attribute a
        WHERE a.attrelid = 'jobs'::regclass
          AND a.attname = 'id';

        SELECT format_type(a.atttypid, a.atttypmod)
        INTO user_id_type
        FROM pg_attribute a
        WHERE a.attrelid = 'users'::regclass
          AND a.attname = 'id';

        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS job_applications (
            id SERIAL PRIMARY KEY,
            job_id %s NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            applicant_id %s NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT,
            resume_url TEXT,
            resume_file_name TEXT,
            resume_file_type TEXT,
            resume_file_size INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (job_id, applicant_id)
          )',
          job_id_type,
          user_id_type
        );
      END $$;
    `);
  }

  return ensureApplicationsTablePromise;
};

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
      description, tech_stack, experience_level, apply_url, deadline
    } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO jobs
        (poster_id, title, company, location, type, description, tech_stack, experience_level, apply_url, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id, title, company, location, type,
        description,
        tech_stack ? JSON.stringify(tech_stack) : '[]',
        experience_level, apply_url, deadline
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

// APPLY TO JOB
const applyToJob = async (req, res) => {
  try {
    await ensureApplicationsTable();

    const { id } = req.params;
    const { message, resume_url, resume_file_name, resume_file_type, resume_file_size } = req.body;

    const existing = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = existing.rows[0];
    if (String(job.poster_id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot apply to your own job posting' });
    }

    const resumeUrl = resume_url?.trim() || null;
    if (resumeUrl) {
      try {
        new URL(resumeUrl);
      } catch {
        return res.status(400).json({ message: 'Please enter a valid resume or portfolio URL' });
      }
    }

    await pool.query(
      `INSERT INTO job_applications (
         job_id, applicant_id, message, resume_url,
         resume_file_name, resume_file_type, resume_file_size
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (job_id, applicant_id)
       DO UPDATE SET
         message = EXCLUDED.message,
         resume_url = EXCLUDED.resume_url,
         resume_file_name = EXCLUDED.resume_file_name,
         resume_file_type = EXCLUDED.resume_file_type,
         resume_file_size = EXCLUDED.resume_file_size,
         created_at = NOW()`,
      [
        job.id,
        req.user.id,
        message?.trim() || null,
        resumeUrl,
        resume_file_name || null,
        resume_file_type || null,
        resume_file_size || null,
      ]
    );

    await pool.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, entity_id)
       VALUES ($1, $2, 'job_apply', $3)`,
      [job.poster_id, req.user.id, job.id]
    );

    res.status(200).json({ message: '✅ Application submitted successfully!' });
  } catch (error) {
    console.error('ApplyToJob error:', error);
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

module.exports = { getAllJobs, getJobById, createJob, applyToJob, deleteJob };
