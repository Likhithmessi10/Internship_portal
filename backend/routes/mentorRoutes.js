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

const upload = require('../middleware/uploadMiddleware');

// Attendance
router.post('/attendance', upload.single('file'), markAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);
router.get('/attendance', getAttendance);

module.exports = router;
