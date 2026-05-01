const express = require('express');
const { register, registerAdmin, login, refreshToken, getMe, resetPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply strict rate limiting to auth endpoints
router.use(authLimiter);

router.post('/register', register);
router.post('/admin/register', registerAdmin);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/reset-password', protect, resetPassword);

module.exports = router;
