const express = require('express');
const { register, registerAdmin, login, refreshToken, getMe, resetPassword, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply strict rate limiting to auth endpoints
router.use(authLimiter);

router.post('/register', register);
// Staff creation: requires an authenticated HOD or ADMIN — no public self-registration
router.post('/admin/register', protect, authorize('ADMIN', 'HOD'), registerAdmin);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/reset-password', protect, resetPassword);
router.put('/update-profile', protect, upload.single('photo'), updateProfile);

module.exports = router;
