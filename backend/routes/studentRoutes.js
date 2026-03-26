const express = require('express');
const { upsertProfile, getProfile, upsertStipend } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/profile', protect, upsertProfile);
router.get('/profile', protect, getProfile);
router.post('/applications/:id/stipend', protect, upsertStipend);

module.exports = router;
