const express = require('express');
const { getInternships, getInternshipDetails, applyForInternship } = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getInternships);
router.get('/:id', getInternshipDetails);

const fileValidator = require('../middleware/fileValidator');

router.post('/:id/apply', protect, upload.any(), fileValidator, applyForInternship);

module.exports = router;
