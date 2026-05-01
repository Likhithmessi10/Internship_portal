const express = require('express');
const {
    getCommitteeApplications,
    submitEvaluation,
    giveFinalApproval,
    getCommitteeStatus
} = require('../controllers/prtiController');
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

// All routes require authentication and PRTI/Committee role
router.use(protect);
// Committee Management
router.get('/committees/applications', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), getCommitteeApplications);
router.post('/committees/evaluate', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), submitEvaluation);
router.post('/committees/approve', authorize('CE_PRTI', 'ADMIN'), giveFinalApproval);
router.get('/committees/:internshipId/status', authorize('CE_PRTI', 'ADMIN', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'), getCommitteeStatus);

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
