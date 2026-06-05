const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

/**
 * Get user's notifications
 * Query params: page, limit, unreadOnly
 */
exports.getUserNotifications = async (req, res) => {
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  const result = await notificationService.getUserNotifications(
    req.user.id,
    parseInt(page),
    parseInt(limit),
    unreadOnly === 'true'
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  // Verify notification belongs to user
  const notification = await notificationService.getNotificationById(notificationId);

  if (notification.recipient._id.toString() !== req.user.id) {
    throw new AppError('You can only read your own notifications', 403);
  }

  const updatedNotification = await notificationService.markAsRead(notificationId);

  res.status(200).json({
    success: true,
    data: updatedNotification,
    message: 'Notification marked as read',
  });
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res.status(200).json({
    success: true,
    data: result,
    message: 'All notifications marked as read',
  });
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
  const Notification = require('../models/Notification');

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: {
      unreadCount,
    },
  });
};
