const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/verify-email', authController.verifyEmail);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-request', authController.resetRequest);
router.post('/reset-verify', authController.resetVerify);
router.post('/reset-complete', authController.resetComplete);

// Protected routes
router.get('/me', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new (require('../utils/AppError'))('User not found', 404));
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Admin and Employee - Get all users
router.get('/users', protect, authorizeRoles('admin', 'employee'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
