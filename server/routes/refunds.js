const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const refundController = require('../controllers/refundController');

// ─── Static routes MUST come before dynamic /:refundId routes ─────────────────

// Customer routes
router.post('/request', protect, authorizeRoles('customer', 'admin'), refundController.requestRefund);
router.get('/my-refunds', protect, authorizeRoles('customer', 'admin'), refundController.getMyRefunds);

// Admin static routes (must be before /:refundId)
router.get('/admin/all', protect, authorizeRoles('admin'), refundController.getAllRefunds);
router.get('/admin/stats', protect, authorizeRoles('admin'), refundController.getRefundStats);

// Dynamic /:refundId routes
router.get('/:refundId', protect, refundController.getRefundDetails);
router.patch('/:refundId/approve', protect, authorizeRoles('admin'), refundController.approveRefund);
router.patch('/:refundId/reject', protect, authorizeRoles('admin'), refundController.rejectRefund);
router.patch('/:refundId/process', protect, authorizeRoles('admin'), refundController.markAsProcessed);

module.exports = router;
