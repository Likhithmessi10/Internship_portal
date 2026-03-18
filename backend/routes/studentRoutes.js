const express = require('express');
const { upsertProfile, getProfile } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/profile', protect, upsertProfile);
router.get('/profile', protect, getProfile);

module.exports = router;
