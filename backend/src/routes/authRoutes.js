const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');

router.post('/signup', c.signup);
router.post('/login', c.login);
router.post('/forgot-password', c.forgotPassword);
router.post('/verify-otp', c.verifyOtp);
router.post('/reset-password', c.resetPassword);
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.post('/logout', c.logout);

module.exports = router;
