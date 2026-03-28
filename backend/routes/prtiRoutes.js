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
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and PRTI/Committee role
router.use(protect);
router.use(authorize('CE_PRTI', 'ADMIN'));

// Committee Management
router.get('/committees/applications', getCommitteeApplications);
router.post('/committees/evaluate', submitEvaluation);
router.post('/committees/approve', giveFinalApproval);
router.get('/committees/:internshipId/status', getCommitteeStatus);

// Document Configuration
router.get('/config/documents', getDocumentConfig);
router.put('/config/documents', updateDocumentConfig);
router.get('/config/documents/:internshipId', getInternshipDocuments);
router.put('/config/documents/:internshipId', setInternshipDocuments);

module.exports = router;
