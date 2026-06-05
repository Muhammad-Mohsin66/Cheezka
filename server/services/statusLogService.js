const OrderStatusLog = require('../models/OrderStatusLog');
const PaymentLog = require('../models/PaymentLog');
const RefundLog = require('../models/RefundLog');

/**
 * Status Log Service
 * Centralized service for logging status changes across orders, payments, and refunds
 */
class StatusLogService {
  /**
   * Log order status change
   */
  static async logOrderStatusChange(orderId, previousStatus, newStatus, changedBy, reason = null, notes = null) {
    try {
      const log = await OrderStatusLog.create({
        order: orderId,
        previousStatus,
        newStatus,
        changedBy,
        reason,
        notes,
      });
      return log;
    } catch (error) {
      console.error('Error logging order status:', error);
      throw error;
    }
  }

  /**
   * Log payment action
   */
  static async logPaymentAction(paymentId, action, performedBy, note = null, previousStatus = null, newStatus = null) {
    try {
      const log = await PaymentLog.create({
        payment: paymentId,
        action,
        performedBy,
        note,
        previousStatus,
        newStatus,
      });
      return log;
    } catch (error) {
      console.error('Error logging payment action:', error);
      throw error;
    }
  }

  /**
   * Log refund action
   */
  static async logRefundAction(refundId, action, performedBy, amount = null, note = null, previousStatus = null, newStatus = null) {
    try {
      const log = await RefundLog.create({
        refund: refundId,
        action,
        performedBy,
        amount,
        note,
        previousStatus,
        newStatus,
      });
      return log;
    } catch (error) {
      console.error('Error logging refund action:', error);
      throw error;
    }
  }

  /**
   * Get order status history
   */
  static async getOrderStatusHistory(orderId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const logs = await OrderStatusLog.find({ order: orderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('changedBy', 'name email')
      .lean();

    const total = await OrderStatusLog.countDocuments({ order: orderId });

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payment action history
   */
  static async getPaymentHistory(paymentId) {
    const logs = await PaymentLog.find({ payment: paymentId })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email')
      .lean();

    return logs;
  }

  /**
   * Get refund action history
   */
  static async getRefundHistory(refundId) {
    const logs = await RefundLog.find({ refund: refundId })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email')
      .lean();

    return logs;
  }
}

module.exports = StatusLogService;
