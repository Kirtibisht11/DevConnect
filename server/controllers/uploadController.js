const { cloudinary } = require('../config/cloudinary');
const pool = require('../db');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');

const saveResumeLocally = async (req) => {
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${req.user.id}-${Date.now()}-${safeOriginalName}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.promises.writeFile(filePath, req.file.buffer);

  const protocol = req.protocol;
  const host = req.get('host');

  return {
    secure_url: `${protocol}://${host}/uploads/resumes/${fileName}`,
  };
};

const uploadResumeToCloudinary = (req) => {
  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  );

  if (!hasCloudinaryConfig) {
    return saveResumeLocally(req);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'devconnect/resumes',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(req.file.buffer);
  }).catch(async (error) => {
    console.error('Cloudinary resume upload failed, using local storage:', error.message);
    return saveResumeLocally(req);
  });
};

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

const uploadPostImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'devconnect/posts',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.status(200).json({
      message: '✅ Post image uploaded!',
      image_url: result.secure_url
    });

  } catch (error) {
    console.error('UploadPostImage error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

const uploadMessageAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'devconnect/messages',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.status(200).json({
      message: 'Attachment uploaded',
      attachment_url: result.secure_url,
      attachment_type: req.file.mimetype,
      attachment_name: req.file.originalname,
      attachment_size: req.file.size,
    });
  } catch (error) {
    console.error('UploadMessageAttachment error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const lowerFileName = req.file.originalname.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((extension) => lowerFileName.endsWith(extension));

    if (!allowedMimeTypes.includes(req.file.mimetype) && !hasAllowedExtension) {
      return res.status(400).json({ message: 'Only PDF, DOC, or DOCX resumes are allowed' });
    }

    const result = await uploadResumeToCloudinary(req);

    res.status(200).json({
      message: 'Resume uploaded',
      resume_url: result.secure_url,
      resume_file_name: req.file.originalname,
      resume_file_type: req.file.mimetype,
      resume_file_size: req.file.size,
    });
  } catch (error) {
    console.error('UploadResume error:', error);
    res.status(500).json({
      message: error.message || 'Server error during resume upload'
    });
  }
};

module.exports = {
  uploadAvatar,
  uploadCover,
  uploadPostImage,
  uploadMessageAttachment,
  uploadResume
};
