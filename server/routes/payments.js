const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const uploadPaymentScreenshot = require('../middleware/uploadPayment');

/**
 * CUSTOMER ROUTES (Protected)
 */

// Upload payment screenshot
router.post(
  '/upload/:orderId',
  protect,
  authorizeRoles('customer'),
  uploadPaymentScreenshot.single('screenshot'),
  paymentController.uploadPaymentScreenshot
);

// Get my payments
router.get('/my-payments/list', protect, authorizeRoles('customer'), paymentController.getMyPayments);

/**
 * ADMIN ROUTES (Protected)
 */

// Get all payments (admin/employee only)
router.get('/admin/all', protect, authorizeRoles('admin', 'employee'), paymentController.getAllPayments);

// Verify payment (admin/employee only)
router.patch(
  '/:paymentId/verify',
  protect,
  authorizeRoles('admin', 'employee'),
  paymentController.verifyPayment
);

// Reject payment (admin/employee only)
router.patch(
  '/:paymentId/reject',
  protect,
  authorizeRoles('admin', 'employee'),
  paymentController.rejectPayment
);

/**
 * SHARED ROUTES (Protected)
 */

// Get payment details (customer, admin, or related user)
router.get('/:paymentId/details', protect, paymentController.getPaymentDetails);

module.exports = router;
