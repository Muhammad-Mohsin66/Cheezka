const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

/**
 * Audit Log Service
 * Centralized service for logging all admin actions and sensitive operations
 */
class AuditLogService {
  /**
   * Create an audit log entry
   * @param {Object} data - Audit log data
   * @returns {Promise} Created audit log document
   */
  static async logAction(data) {
    try {
      const {
        user,
        action,
        targetCollection,
        targetId,
        targetName,
        changes,
        ipAddress,
        userAgent,
        metadata,
        status = 'success',
        errorMessage = null,
      } = data;

      let userModel = 'User';
      if (user) {
        const isEmployee = await mongoose.model('Employee').exists({ _id: user });
        if (isEmployee) userModel = 'Employee';
        else {
          const isRider = await mongoose.model('Rider').exists({ _id: user });
          if (isRider) userModel = 'Rider';
          else {
            const isCustomer = await mongoose.model('Customer').exists({ _id: user });
            if (isCustomer) userModel = 'Customer';
          }
        }
      }

      const auditLog = await AuditLog.create({
        user,
        userModel,
        action,
        targetCollection,
        targetId,
        targetName,
        changes,
        ipAddress,
        userAgent,
        metadata,
        status,
        errorMessage,
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Log product creation
   */
  static async logProductCreate(userId, product, ipAddress, userAgent) {
    return this.logAction({
      user: userId,
      action: 'create',
      targetCollection: 'Product',
      targetId: product._id,
      targetName: product.name,
      metadata: { product: product.toObject() },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log product update
   */
  static async logProductUpdate(userId, productId, productName, before, after, ipAddress, userAgent) {
    return this.logAction({
      user: userId,
      action: 'update',
      targetCollection: 'Product',
      targetId: productId,
      targetName: productName,
      changes: { before, after },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log product deletion
   */
  static async logProductDelete(userId, productId, productName, ipAddress, userAgent) {
    return this.logAction({
      user: userId,
      action: 'delete',
      targetCollection: 'Product',
      targetId: productId,
      targetName: productName,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log order status change
   */
  static async logOrderStatusChange(userId, orderId, previousStatus, newStatus, ipAddress, userAgent) {
    return this.logAction({
      user: userId,
      action: 'update',
      targetCollection: 'Order',
      targetId: orderId,
      targetName: `Order ${orderId}`,
      changes: { before: { status: previousStatus }, after: { status: newStatus } },
      ipAddress,
      userAgent,
      metadata: { action: 'status_change' },
    });
  }

  /**
   * Log refund approval/rejection
   */
  static async logRefundAction(userId, refundId, action, before, after, ipAddress, userAgent) {
    return this.logAction({
      user: userId,
      action,
      targetCollection: 'Refund',
      targetId: refundId,
      targetName: `Refund ${refundId}`,
      changes: { before, after },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filters
   */
  static async getAuditLogs(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filters)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role')
      .lean();

    const total = await AuditLog.countDocuments(filters);

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get user's audit trail
   */
  static async getUserAuditTrail(userId, options = {}) {
    return this.getAuditLogs({ user: userId }, options);
  }
}

module.exports = AuditLogService;
