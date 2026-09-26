const express = require('express');
const { body } = require('express-validator');

const {
signup,
login,
forgotPassword,
verifyOtp,
resetPassword,
getProfile,
updateProfile,
logout,
} = require('../controllers/authController');

const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/signup
router.post(
'/signup',
[
body('name').trim().notEmpty().withMessage('Name is required'),
body('email').isEmail().withMessage('Please provide a valid email'),
body('password')
.isLength({ min: 6 })
.withMessage('Password must be at least 6 characters'),
],
signup
);

// POST /api/auth/login
router.post(
'/login',
[
body('email').isEmail().withMessage('Please provide a valid email'),
body('password').notEmpty().withMessage('Password is required'),
],
login
);

// POST /api/auth/forgot-password
router.post(
'/forgot-password',
[body('email').isEmail().withMessage('Please provide a valid email')],
forgotPassword
);

// POST /api/auth/verify-otp
router.post(
'/verify-otp',
[
body('email').isEmail().withMessage('Please provide a valid email'),
body('otp').notEmpty().withMessage('OTP is required'),
],
verifyOtp
);

// POST /api/auth/reset-password
router.post(
'/reset-password',
[
body('email').isEmail().withMessage('Please provide a valid email'),
body('otp').notEmpty().withMessage('OTP is required'),
body('newPassword')
.isLength({ min: 6 })
.withMessage('New password must be at least 6 characters'),
],
resetPassword
);

// GET /api/auth/profile
router.get('/profile', authMiddleware, getProfile);

// PUT /api/auth/profile
router.put('/profile', authMiddleware, updateProfile);

// POST /api/auth/logout
router.post('/logout', authMiddleware, logout);

module.exports = router;
