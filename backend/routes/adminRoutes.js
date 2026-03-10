const express = require('express');
const {
    createInternship,
    getAllInternships,
    deleteInternship,
    toggleInternship,
    getApplications,
    getRejectedApplications,
    updateApplicationStatus,
    exportApplications,
    extendDeadline
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

// Internship Management
router.get('/internships', getAllInternships);
router.post('/internships', createInternship);
router.delete('/internships/:id', deleteInternship);
router.put('/internships/:id/toggle', toggleInternship);
router.put('/internships/:id/deadline', extendDeadline);

// Application Management
router.get('/internships/:id/applications', getApplications);
router.get('/internships/:id/export', exportApplications);
router.get('/applications/rejected', getRejectedApplications);
router.put('/applications/:id', updateApplicationStatus);

module.exports = router;
