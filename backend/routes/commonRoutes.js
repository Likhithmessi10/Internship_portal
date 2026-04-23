const express = require('express');
const { exportApplicationsGlobal } = require('../controllers/exportController');
const { downloadDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Global dynamic export route - Role-based scoping handled in controller
router.get('/export/applications', exportApplicationsGlobal);

// Secure Document Access
router.get('/documents/:id', downloadDocument);

module.exports = router;
