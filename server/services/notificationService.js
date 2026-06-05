const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../config/email');

/**
 * Create a new notification
 * @param {string} recipientId - User ID receiving notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (order, payment, refund, system)
 * @param {string} relatedId - Optional related document ID
 * @returns {Promise<Object>} Created notification
 */
exports.createNotification = async (recipientId, title, message, type, relatedId = null) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      relatedId: relatedId || undefined,
    });

    // Populate before returning
    await notification.populate('recipient', 'name email phone');

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications shouldn't break main operations
    return null;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
exports.markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('recipient', 'name email phone');

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
exports.markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return {
    acknowledged: result.acknowledged,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Get user's notifications with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {boolean} unreadOnly - Get only unread notifications (default: false)
 * @returns {Promise<Object>} Notifications and pagination info
 */
exports.getUserNotifications = async (userId, page = 1, limit = 10, unreadOnly = false) => {
  const skip = (page - 1) * limit;

  const filter = { recipient: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  // Get total count
  const totalCount = await Notification.countDocuments(filter);

  // Get paginated notifications
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('recipient', 'name email phone');

  // Get unread count
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return {
    notifications,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
    unreadCount,
  };
};

/**
 * Send email notification
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {string} actionUrl - Optional action URL
 * @returns {Promise<Object>} Email result
 */
exports.sendEmailNotification = async (email, subject, message, actionUrl = null) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0 0 15px 0;">Cheezka Notification</h2>
          <h3 style="color: #555; margin: 0 0 15px 0;">${subject}</h3>
          <p style="color: #666; line-height: 1.6; margin: 15px 0;">${message}</p>
          ${
            actionUrl
              ? `
            <p style="margin: 20px 0;">
              <a href="${actionUrl}" style="
                display: inline-block;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
              ">View Details</a>
            </p>
          `
              : ''
          }
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification from Cheezka. Please do not reply to this email.
        </p>
      </div>
    `;

    return await sendEmail(email, `Cheezka - ${subject}`, html);
  } catch (error) {
    console.error('Error sending email notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Notification
 */
exports.getNotificationById = async (notificationId) => {
  const notification = await Notification.findById(notificationId).populate(
    'recipient',
    'name email phone'
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
exports.deleteNotification = async (notificationId) => {
  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
};

/**
 * Notify multiple users (admin notification broadcast)
 * @param {array} userIds - Array of user IDs to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} relatedId - Related document ID
 * @returns {Promise<array>} Created notifications
 */
exports.notifyMultipleUsers = async (userIds, title, message, type, relatedId = null) => {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        exports.createNotification(userId, title, message, type, relatedId)
      )
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Error notifying multiple users:', error);
    return [];
  }
};
