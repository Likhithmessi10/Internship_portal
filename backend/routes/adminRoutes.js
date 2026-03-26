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
    exportAdvanced,
    extendDeadline,
    getPortalConfig,
    updatePortalConfig,
    getCommitteeDetails,
    updateCommitteeDetails,
    getUsersByRole,
    getStipendDetails,
    updateStipendDetails
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible configurations (needed for registration)
router.get('/config', getPortalConfig);

router.use(protect);
router.use(authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'));

// Portal Configuration Updates (Admin Only)
router.put('/config', authorize('ADMIN'), updatePortalConfig);

// Internship Management
router.get('/internships', getAllInternships);
router.post('/internships', createInternship);
router.delete('/internships/:id', deleteInternship);
router.put('/internships/:id/toggle', toggleInternship);
router.put('/internships/:id/deadline', extendDeadline);

// Committee Management
router.get('/internships/:id/committee', getCommitteeDetails);
router.put('/internships/:id/committee', updateCommitteeDetails);

// Application Management
router.get('/internships/:id/applications', getApplications);
router.get('/internships/:id/export', exportApplications);
router.get('/applications/export/advanced', exportAdvanced);
router.get('/applications/rejected', getRejectedApplications);
router.put('/applications/:id', updateApplicationStatus);

// Stipend Management
router.get('/applications/:id/stipend', getStipendDetails);
router.put('/applications/:id/stipend', updateStipendDetails);

router.post('/internships/:id/allocate', authorize('ADMIN'), (req, res, next) => {
    const { allocateApplicantsAction } = require('../controllers/adminController');
    allocateApplicantsAction(req, res, next);
});

// User Management
router.get('/users', getUsersByRole);

module.exports = router;
