const express = require('express');
const {
    createInternship,
    updateApplicationStatus, exportApplications, getApplications
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/internships', createInternship);
router.get('/internships/:id/applications', getApplications);
router.get('/internships/:id/export', exportApplications);
router.put('/applications/:id', updateApplicationStatus);

module.exports = router;
