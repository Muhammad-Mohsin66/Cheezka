const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

/**
 * Get user's notifications
 * Query params: page, limit, unreadOnly
 */
exports.getUserNotifications = async (req, res) => {
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  if (req.user.role === 'admin') {
    // Admins get all notifications in the system
    const Notification = require('../models/Notification');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    const totalCount = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('recipient', 'name email phone');

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
        unreadCount: await Notification.countDocuments({ isRead: false }),
      }
    });
  }

  // Non-admins get only their own notifications
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
 * Create/Broadcast notification (admin only)
 * Body: { title, message, type, recipientId }
 */
exports.createNotification = async (req, res) => {
  const { title, message, type, recipientId } = req.body;

  if (!title || !message || !type) {
    throw new AppError('Title, message, and type are required', 400);
  }

  let notifications = [];
  if (recipientId) {
    // Send to a single user
    const n = await notificationService.createNotification(recipientId, title, message, type);
    if (n) notifications.push(n);
  } else {
    // Broadcast to all users across all collections
    const User = require('../models/User');
    const Customer = require('../models/Customer');
    const Employee = require('../models/Employee');
    const Rider = require('../models/Rider');
    
    const [admins, customers, employees, riders] = await Promise.all([
      User.find({ isActive: true }),
      Customer.find({ isActive: true }),
      Employee.find({ isActive: true }),
      Rider.find({ isActive: true }),
    ]);
    const users = [...admins, ...customers, ...employees, ...riders];
    const userIds = users.map((u) => u._id);
    notifications = await notificationService.notifyMultipleUsers(userIds, title, message, type);
  }

  res.status(201).json({
    success: true,
    data: notifications,
    message: recipientId ? 'Notification sent successfully' : 'Notification broadcasted successfully',
  });
};

/**
 * Delete notification (admin only)
 */
exports.deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  await notificationService.deleteNotification(notificationId);
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
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
