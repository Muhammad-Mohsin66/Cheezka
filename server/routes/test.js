const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');

/**
 * Test Routes for Authentication & RBAC
 * These routes are for testing and verification purposes
 */

// Admin-only test route
router.get('/admin', protect, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Employee-only test route
router.get('/employee', protect, authorizeRoles('employee'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee access granted',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Rider-only test route
router.get('/rider', protect, authorizeRoles('rider'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rider access granted',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Customer-only test route
router.get('/customer', protect, authorizeRoles('customer'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Customer access granted',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Protected route accessible by admin, employee, and rider
router.get('/staff', protect, authorizeRoles('admin', 'employee', 'rider'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff access granted',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Any authenticated user can access
router.get('/protected', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Protected route accessed',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// Public test route (no auth required)
router.get('/public', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Public route - no authentication required',
  });
});

module.exports = router;
