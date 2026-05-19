const express = require('express');
const router = express.Router();
const { getAllJobs, getJobById, createJob, deleteJob, applyToJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', protect, createJob);
router.post('/:id/apply', protect, applyToJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;