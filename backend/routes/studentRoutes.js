const express = require('express');
const { upsertProfile, getProfile, upsertStipend, uploadJoiningDocuments, reapplyLocation } = require('../controllers/studentController');
const { submitWorkLog, getStudentWorkLogs } = require('../controllers/workLogController');
const {
    submitWork,
    getStudentWork,
    reviewSubmission,
    getMentorSubmissions
} = require('../controllers/workSubmissionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const fileValidator = require('../middleware/fileValidator');

const router = express.Router();

router.post('/profile', protect, upload.single('photo'), upsertProfile);
router.get('/profile', protect, getProfile);
router.post('/applications/:id/stipend', protect, authorize('STUDENT'), upsertStipend);
// Joining documents (NOC, BOND, UNDERTAKING) — unlocked only after REPORTED status
router.post('/applications/:id/joining-documents', protect, authorize('STUDENT'), upload.any(), fileValidator, uploadJoiningDocuments);
router.put('/applications/:id/reapply-location', protect, authorize('STUDENT'), reapplyLocation);
// Daily work logs
router.post('/applications/:id/work-log', protect, authorize('STUDENT'), submitWorkLog);
router.get('/applications/:id/work-logs', protect, authorize('STUDENT'), getStudentWorkLogs);
// Student Work Management
router.get('/work', protect, authorize('STUDENT'), getStudentWork);
router.post('/work/submit/:assignmentId', protect, authorize('STUDENT'), upload.single('file'), submitWork);

// Mentor Submission Review (for mentors)
router.put('/work/review/:submissionId', protect, authorize('MENTOR', 'ADMIN'), reviewSubmission);
router.get('/work/submissions', protect, authorize('MENTOR', 'ADMIN'), getMentorSubmissions);

module.exports = router;
