const express = require('express');
const router = express.Router();
const { login, register, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
