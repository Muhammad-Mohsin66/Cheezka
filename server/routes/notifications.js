const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Static routes MUST come before dynamic /:notificationId routes ───────────

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/', asyncHandler(notificationController.getUserNotifications));

/**
 * POST /api/notifications
 * Create/Broadcast notification (admin only)
 */
router.post('/', authorizeRoles('admin'), asyncHandler(notificationController.createNotification));

/**
 * GET /api/notifications/unread/count
 * Get count of unread notifications
 */
router.get('/unread/count', asyncHandler(notificationController.getUnreadCount));

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', asyncHandler(notificationController.markAllAsRead));

/**
 * PUT /api/notifications/:notificationId/read
 * Mark single notification as read
 */
router.put('/:notificationId/read', asyncHandler(notificationController.markAsRead));

/**
 * DELETE /api/notifications/:notificationId
 * Delete single notification (admin only)
 */
router.delete('/:notificationId', authorizeRoles('admin'), asyncHandler(notificationController.deleteNotification));

module.exports = router;
