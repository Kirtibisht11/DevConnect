const express = require('express');
const router = express.Router();
const { getAllJobs, getJobById, createJob, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', protect, createJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;