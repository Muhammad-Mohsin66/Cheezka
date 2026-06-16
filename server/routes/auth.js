const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Rider = require('../models/Rider');

const getModelByRole = (role) => {
  switch (role) {
    case 'admin':
      return User;
    case 'customer':
      return Customer;
    case 'employee':
      return Employee;
    case 'rider':
      return Rider;
    default:
      return User;
  }
};

// Public routes
router.post('/register', validateRegister, authController.registerUser);
router.post('/login', validateLogin, authController.loginUser);
router.post('/logout', authController.logout);
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
    const Model = getModelByRole(req.user.role);
    const user = await Model.findById(req.user.id).select('-password');
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

router.put('/me', protect, authController.updateMe);

// Admin and Employee - Get all users
router.get('/users', protect, authorizeRoles('admin', 'employee'), async (req, res, next) => {
  try {
    const [admins, employees, riders, customers] = await Promise.all([
      User.find({}).select('-password'),
      Employee.find({}).select('-password'),
      Rider.find({}).select('-password'),
      Customer.find({}).select('-password'),
    ]);
    const users = [...admins, ...employees, ...riders, ...customers];
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
