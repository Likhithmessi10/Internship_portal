const express = require('express');
const { register, registerAdmin, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/admin/register', registerAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
