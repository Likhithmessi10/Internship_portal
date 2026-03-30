const express = require('express');
const { upsertProfile, getProfile, upsertStipend } = require('../controllers/studentController');
const {
    submitWork,
    getStudentWork,
    reviewSubmission,
    getMentorSubmissions
} = require('../controllers/workSubmissionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/profile', protect, upsertProfile);
router.get('/profile', protect, getProfile);
router.post('/applications/:id/stipend', protect, upsertStipend);

// Student Work Management
router.get('/work', protect, authorize('STUDENT'), getStudentWork);
router.post('/work/submit/:assignmentId', protect, authorize('STUDENT'), upload.single('file'), submitWork);

// Mentor Submission Review (for mentors)
router.put('/work/review/:submissionId', protect, authorize('MENTOR', 'ADMIN'), reviewSubmission);
router.get('/work/submissions', protect, authorize('MENTOR', 'ADMIN'), getMentorSubmissions);

module.exports = router;
