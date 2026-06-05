const InventoryLog = require('../models/InventoryLog');

/**
 * Inventory Log Service
 * Tracks all inventory changes with complete history
 */
class InventoryLogService {
  /**
   * Log inventory change
   * @param {Object} data - Inventory change data
   * @returns {Promise} Created inventory log document
   */
  static async logChange(data) {
    try {
      const {
        product,
        changeType, // 'increase' or 'decrease'
        quantity,
        reason, // 'order', 'cancel', 'manual', 'restock', 'damage', 'return'
        relatedOrder = null,
        performedBy,
        previousStock,
        newStock,
        notes = null,
      } = data;

      const log = await InventoryLog.create({
        product,
        changeType,
        quantity,
        reason,
        relatedOrder,
        performedBy,
        previousStock,
        newStock,
        notes,
      });

      return log;
    } catch (error) {
      console.error('Error creating inventory log:', error);
      throw error;
    }
  }

  /**
   * Log order inventory deduction
   */
  static async logOrderInventoryChange(product, quantity, orderId, userId) {
    return this.logChange({
      product,
      changeType: 'decrease',
      quantity,
      reason: 'order',
      relatedOrder: orderId,
      performedBy: userId,
      previousStock: product.stock || 0,
      newStock: (product.stock || 0) - quantity,
    });
  }

  /**
   * Log order cancellation inventory return
   */
  static async logCancellationInventoryReturn(product, quantity, orderId, userId) {
    return this.logChange({
      product,
      changeType: 'increase',
      quantity,
      reason: 'cancel',
      relatedOrder: orderId,
      performedBy: userId,
      previousStock: product.stock || 0,
      newStock: (product.stock || 0) + quantity,
    });
  }

  /**
   * Log manual inventory adjustment
   */
  static async logManualAdjustment(product, quantity, changeType, userId, notes) {
    const previousStock = product.stock || 0;
    const newStock = changeType === 'increase' ? previousStock + quantity : previousStock - quantity;

    return this.logChange({
      product,
      changeType,
      quantity,
      reason: 'manual',
      performedBy: userId,
      previousStock,
      newStock,
      notes,
    });
  }

  /**
   * Log restock
   */
  static async logRestock(product, quantity, userId, notes = null) {
    return this.logChange({
      product,
      changeType: 'increase',
      quantity,
      reason: 'restock',
      performedBy: userId,
      previousStock: product.stock || 0,
      newStock: (product.stock || 0) + quantity,
      notes,
    });
  }

  /**
   * Get inventory history for a product
   */
  static async getProductHistory(productId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const logs = await InventoryLog.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email')
      .populate('relatedOrder', 'orderNumber')
      .lean();

    const total = await InventoryLog.countDocuments({ product: productId });

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get inventory changes for a specific reason
   */
  static async getChangesByReason(reason, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const logs = await InventoryLog.find({ reason })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .lean();

    const total = await InventoryLog.countDocuments({ reason });

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get inventory discrepancies (useful for auditing)
   * Compares sum of all changes with current stock
   */
  static async checkInventoryDiscrepancies(productId, currentStock) {
    const logs = await InventoryLog.find({ product: productId });

    let calculatedStock = 0;
    logs.forEach((log) => {
      if (log.changeType === 'increase') {
        calculatedStock += log.quantity;
      } else {
        calculatedStock -= log.quantity;
      }
    });

    return {
      productId,
      calculatedStock,
      currentStock,
      hasDiscrepancy: calculatedStock !== currentStock,
      difference: currentStock - calculatedStock,
    };
  }
}

module.exports = InventoryLogService;
