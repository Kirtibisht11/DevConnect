const { cloudinary } = require('../config/cloudinary');
const pool = require('../db');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'devconnect/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update profile in DB
    await pool.query(
      'UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2',
      [result.secure_url, req.user.id]
    );

    res.status(200).json({
      message: '✅ Avatar uploaded!',
      avatar_url: result.secure_url
    });

  } catch (error) {
    console.error('UploadAvatar error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'devconnect/covers',
          transformation: [
            { width: 1200, height: 300, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    await pool.query(
      'UPDATE profiles SET cover_url = $1, updated_at = NOW() WHERE user_id = $2',
      [result.secure_url, req.user.id]
    );

    res.status(200).json({
      message: '✅ Cover uploaded!',
      cover_url: result.secure_url
    });

  } catch (error) {
    console.error('UploadCover error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

module.exports = { uploadAvatar, uploadCover };