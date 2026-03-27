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
    updateUserRole,
    getStipendDetails,
    updateStipendDetails,
    getAllInterns,
    getMeetings
} = require('../controllers/adminController');
const { getAuditLogs } = require('../controllers/auditController');
const { getSystemHealth } = require('../controllers/systemController');
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
router.get('/interns/all', authorize('ADMIN', 'CE_PRTI'), getAllInterns);
router.get('/meetings', authorize('ADMIN', 'CE_PRTI', 'HOD'), getMeetings);
router.post('/internships', createInternship);
router.delete('/internships/:id', deleteInternship);
router.put('/internships/:id/toggle', toggleInternship);
router.put('/internships/:id/deadline', extendDeadline);

// Committee Management
router.get('/internships/:id/committee', getCommitteeDetails);
router.put('/internships/:id/committee', updateCommitteeDetails);

// Application Management
router.get('/internships/:id/applications', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), getApplications);
router.get('/internships/:id/export', exportApplications);
router.get('/applications/export/advanced', exportAdvanced);
router.get('/applications/rejected', authorize('ADMIN', 'HOD'), getRejectedApplications);
router.put('/applications/:id', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), updateApplicationStatus);

// Stipend Management
router.get('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), getStipendDetails);
router.put('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), updateStipendDetails);

router.post('/internships/:id/allocate', authorize('ADMIN'), (req, res, next) => {
    const { allocateApplicantsAction } = require('../controllers/adminController');
    allocateApplicantsAction(req, res, next);
});

// User Management
router.get('/users', getUsersByRole);
router.put('/users/:id/role', authorize('ADMIN', 'CE_PRTI'), updateUserRole);

// Infrastructure & Diagnostics
router.get('/audit-logs', authorize('ADMIN', 'CE_PRTI'), getAuditLogs);
router.get('/system/health', authorize('ADMIN', 'CE_PRTI'), getSystemHealth);

module.exports = router;
