const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles('admin'));

/**
 * GET /api/reports/dashboard
 * Get dashboard summary with key metrics
 */
router.get('/dashboard', asyncHandler(reportController.getDashboardSummary));

/**
 * GET /api/reports/revenue?type=daily|weekly|monthly
 * Get revenue report grouped by period
 */
router.get('/revenue', asyncHandler(reportController.getRevenueReport));

/**
 * GET /api/reports/most-selling
 * Get top 5 most selling products
 */
router.get('/most-selling', asyncHandler(reportController.getMostSellingProducts));

/**
 * GET /api/reports/refunds
 * Get refund report with status breakdown
 */
router.get('/refunds', asyncHandler(reportController.getRefundReport));

/**
 * GET /api/reports/inventory-alerts
 * Get low stock and out of stock products
 */
router.get('/inventory-alerts', asyncHandler(reportController.getInventoryAlerts));

/**
 * GET /api/reports/payment-breakdown
 * Get payment method breakdown
 */
router.get('/payment-breakdown', asyncHandler(reportController.getPaymentMethodBreakdown));

module.exports = router;
