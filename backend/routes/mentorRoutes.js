const express = require('express');
const {
    getMentorInternships,
    getInternshipInterns,
    createTask,
    getTasks,
    getSubmissions,
    reviewSubmission
} = require('../controllers/mentorController');
const {
    getCompletionSummary,
    saveInternRemarks,
    issueCertificate,
    finalizeInternship
} = require('../controllers/internshipCompletionController');
const {
    markAttendance,
    getAttendance,
    bulkMarkAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All mentor routes require authentication + MENTOR or ADMIN role
router.use(protect);
router.use(authorize('MENTOR', 'ADMIN'));

// Internship overview
router.get('/internships', getMentorInternships);
router.get('/internships/:id/interns', getInternshipInterns);

// Task management
router.post('/tasks', createTask);
router.get('/tasks', getTasks);

// Submissions
router.get('/submissions', getSubmissions);
router.put('/submissions/:id/review', reviewSubmission);

// Complete Internship wizard
router.get('/internships/:id/completion-summary', getCompletionSummary);
router.post('/internships/:internshipId/interns/:applicationId/remarks', saveInternRemarks);
router.post('/internships/:internshipId/interns/:applicationId/certificate', issueCertificate);
router.post('/internships/:id/finalize', finalizeInternship);

const upload = require('../middleware/uploadMiddleware');

// Attendance
router.post('/attendance', upload.single('file'), markAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);
router.get('/attendance', getAttendance);

module.exports = router;
