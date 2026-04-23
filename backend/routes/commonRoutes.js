const express = require('express');
const { exportApplicationsGlobal } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Global dynamic export route - Role-based scoping handled in controller
router.get('/export/applications', exportApplicationsGlobal);

module.exports = router;
