const express = require('express');
const {
    createInternship, updateWeights, getWeights,
    triggerShortlisting, updateApplicationStatus, exportApplications, getApplications
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/internships', createInternship);
router.get('/internships/:id/applications', getApplications);
router.post('/internships/:id/shortlist', triggerShortlisting);
router.get('/internships/:id/export', exportApplications);
router.put('/applications/:id', updateApplicationStatus);

router.get('/config/weights', getWeights);
router.put('/config/weights', updateWeights);

module.exports = router;
