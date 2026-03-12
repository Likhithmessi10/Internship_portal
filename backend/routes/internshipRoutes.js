const express = require('express');
const { getInternships, getInternshipDetails, applyForInternship } = require('../controllers/internshipController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', getInternships);
router.get('/:id', getInternshipDetails);

// Application route requires multipart upload mapping
router.post('/:id/apply', protect, upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'nocLetter', maxCount: 1 },
    { name: 'principalLetter', maxCount: 1 },
    { name: 'hodLetter', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 }
]), applyForInternship);

module.exports = router;
