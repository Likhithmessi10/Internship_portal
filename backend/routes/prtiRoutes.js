const express = require('express');
const {
    getCommitteeApplications,
    submitEvaluation,
    giveFinalApproval,
    markReported,
    getCommitteeStatus
} = require('../controllers/prtiController');
const { publishInternship } = require('../controllers/hodProblemStatementController');
const {
    getDocumentConfig,
    updateDocumentConfig,
    getInternshipDocuments,
    setInternshipDocuments
} = require('../controllers/documentConfigController');
const {
    getCommittee,
    updatePRTIMember,
    getAvailablePRTIMembers
} = require('../controllers/prtiCommitteeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Committee Management
router.get('/committees/applications', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), getCommitteeApplications);
router.post('/committees/evaluate', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), submitEvaluation);
router.post('/committees/approve', authorize('CE_PRTI', 'ADMIN', 'HOD'), giveFinalApproval);
router.post('/committees/mark-reported', authorize('CE_PRTI', 'ADMIN'), markReported);
router.get('/committees/:internshipId/status', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), getCommitteeStatus);

// Internship Publishing (PRTI manually publishes when ready)
router.post('/internships/:id/publish', authorize('CE_PRTI', 'ADMIN'), publishInternship);

// Committee Member Management (PRTI Representative)
router.get('/committees/:internshipId', getCommittee);
router.put('/committees/:internshipId/member', updatePRTIMember);
router.get('/committees/members/available', getAvailablePRTIMembers);

// Document Configuration
router.get('/config/documents', getDocumentConfig);
router.put('/config/documents', updateDocumentConfig);
router.get('/config/documents/:internshipId', getInternshipDocuments);
router.put('/config/documents/:internshipId', setInternshipDocuments);

module.exports = router;
