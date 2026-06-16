const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Customer = require('../models/Customer');
const notificationService = require('../services/notificationService');
const StatusLogService = require('../services/statusLogService');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('./auditLogController');

/**
 * CUSTOMER ACTIONS
 */

/**
 * Request a refund for an order
 * - Validate business rules (Delivered/Cancelled, Verified payment, not COD, no existing refund)
 * - Create refund with "Requested" status
 */
exports.requestRefund = async (req, res) => {
  const { orderId, reason } = req.body;

  // Validation
  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  if (!reason || typeof reason !== 'string') {
    throw new AppError('Refund reason is required', 400);
  }

  if (reason.trim().length < 10) {
    throw new AppError('Reason must be at least 10 characters', 400);
  }

  if (reason.trim().length > 500) {
    throw new AppError('Reason cannot exceed 500 characters', 400);
  }

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify order belongs to customer
  if ((order.customer?._id || order.customer || '').toString() !== req.user.id) {
    throw new AppError('You can only request refund for your own order', 403);
  }

  // BUSINESS RULE 1: Order must be Delivered or Cancelled
  if (!['Delivered', 'Cancelled'].includes(order.orderStatus)) {
    throw new AppError(
      `Cannot request refund for ${order.orderStatus} order. Only Delivered or Cancelled orders can have refunds.`,
      400
    );
  }

  // BUSINESS RULE 2: Payment method must NOT be COD
  if (order.paymentMethod === 'COD') {
    throw new AppError('Cannot request refund for Cash on Delivery orders', 400);
  }

  // BUSINESS RULE 3: Payment must be Verified
  if (order.paymentStatus !== 'Verified') {
    throw new AppError(
      `Cannot request refund. Payment is not verified. Current status: ${order.paymentStatus}`,
      400
    );
  }

  // BUSINESS RULE 4: No existing refund for this order (unique constraint)
  const existingRefund = await Refund.findOne({ order: orderId });
  if (existingRefund) {
    throw new AppError(
      `This order already has a refund request with status: ${existingRefund.status}. Only one refund per order allowed.`,
      400
    );
  }

  // Fetch payment to verify it exists
  const payment = await Payment.findOne({
    order: orderId,
    status: 'Verified',
  });
  if (!payment) {
    throw new AppError('No verified payment found for this order', 404);
  }

  // Create refund request
  const refund = await Refund.create({
    order: orderId,
    payment: payment._id,
    user: req.user.id,
    amount: order.grandTotal,
    reason: reason.trim(),
    status: 'Requested',
  });

  // Log refund request action
  await StatusLogService.logRefundAction(
    refund._id,
    'requested',
    req.user.id,
    refund.amount,
    reason.trim(),
    null,
    'Requested'
  );

  // Notify Admin about refund request
  const admins = await User.find({ role: 'admin' }).select('_id email name');
  for (const admin of admins) {
    await notificationService.createNotification(
      admin._id,
      'Refund Request Received',
      `Refund request for order #${orderId}. Amount: ₹${order.grandTotal}. Reason: ${reason.trim()}`,
      'refund',
      refund._id
    );
  }

  // Send email to first admin
  if (admins.length > 0) {
    await notificationService.sendEmailNotification(
      admins[0].email,
      'Refund Request Received',
      `A refund request has been submitted for order #${orderId}. Amount: ₹${order.grandTotal}. Please review in the admin panel.`
    );
  }

  res.status(201).json({
    success: true,
    message: 'Refund requested successfully',
    data: refund,
  });
};

/**
 * Get customer's refunds
 */
exports.getMyRefunds = async (req, res) => {
  const { status } = req.query;

  // Build filter
  const filter = { user: req.user.id };

  if (status) {
    const validStatuses = ['Requested', 'Approved', 'Rejected', 'Processed'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Valid: ${validStatuses.join(', ')}`,
        400
      );
    }
    filter.status = status;
  }

  // Fetch refunds
  const refunds = await Refund.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: refunds.length,
    data: refunds,
  });
};

/**
 * ADMIN ACTIONS
 */

/**
 * Get all refunds (with filters)
 */
exports.getAllRefunds = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};

  if (status) {
    const validStatuses = ['Requested', 'Approved', 'Rejected', 'Processed'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Valid: ${validStatuses.join(', ')}`,
        400
      );
    }
    filter.status = status;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Fetch refunds
  const refunds = await Refund.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Get total count
  const total = await Refund.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: refunds.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: refunds,
  });
};

/**
 * Get refund details
 */
exports.getRefundDetails = async (req, res) => {
  const { refundId } = req.params;

  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  // Customer can only view their own refunds
  if (req.user.role !== 'admin' && (refund.user?._id || refund.user || '').toString() !== req.user.id) {
    throw new AppError('You can only view your own refunds', 403);
  }

  res.status(200).json({
    success: true,
    data: refund,
  });
};

/**
 * Approve a refund request
 * - Update status to "Approved"
 * - Update Order status to "Refund Requested"
 */
exports.approveRefund = async (req, res) => {
  const { refundId } = req.params;
  const { adminNote } = req.body;

  // Fetch refund
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  // Can only approve "Requested" refunds
  if (refund.status !== 'Requested') {
    throw new AppError(
      `Cannot approve refund with status: ${refund.status}. Only "Requested" refunds can be approved.`,
      400
    );
  }

  // Validate refund's order still exists
  const order = await Order.findById(refund.order);
  if (!order) {
    throw new AppError('Associated order not found', 404);
  }

  // Update refund status to Approved
  const previousRefundStatus = refund.status;
  refund.status = 'Approved';
  if (adminNote) {
    refund.adminNote = adminNote.trim();
  }
  await refund.save();

  // Log refund action
  await StatusLogService.logRefundAction(
    refund._id,
    'approved',
    req.user.id,
    refund.amount,
    adminNote || 'Refund approved by admin',
    previousRefundStatus,
    'Approved'
  );

  // Update order status to "Refund Requested"
  const oldOrderStatus = order.orderStatus;
  order.orderStatus = 'Refund Requested';
  await order.save();

  // Log order status change
  await StatusLogService.logOrderStatusChange(
    order._id,
    oldOrderStatus,
    'Refund Requested',
    req.user.id,
    'Refund Approved',
    adminNote
  );

  // Notify customer of refund approval
  const customer = await Customer.findById(refund.user);
  if (customer) {
    await notificationService.createNotification(
      refund.user,
      'Refund Approved',
      `Your refund request for order #${refund.order} has been approved. Amount: ₹${refund.amount}`,
      'refund',
      refund._id
    );

    await notificationService.sendEmailNotification(
      customer.email,
      'Refund Approved',
      `Your refund request has been approved. Amount: ₹${refund.amount} will be processed soon.`
    );
  }

  // Create Audit Log
  await createAuditEntry(req, 'update', 'Refund', refund._id, `Status: Approved (Amt: Rs. ${refund.amount})`);

  res.status(200).json({
    success: true,
    message: 'Refund approved successfully. Order status updated to "Refund Requested".',
    data: refund,
  });
};

/**
 * Reject a refund request
 * - Update status to "Rejected"
 * - Admin provides rejection reason
 */
exports.rejectRefund = async (req, res) => {
  const { refundId } = req.params;
  const { adminNote } = req.body;

  if (!adminNote || typeof adminNote !== 'string') {
    throw new AppError('Rejection reason (adminNote) is required', 400);
  }

  // Fetch refund
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  // Can only reject "Requested" refunds
  if (refund.status !== 'Requested') {
    throw new AppError(
      `Cannot reject refund with status: ${refund.status}. Only "Requested" refunds can be rejected.`,
      400
    );
  }

  // Update refund status to Rejected with reason
  const previousRefundStatus = refund.status;
  refund.status = 'Rejected';
  refund.adminNote = adminNote.trim();
  await refund.save();

  // Log refund action
  await StatusLogService.logRefundAction(
    refund._id,
    'rejected',
    req.user.id,
    refund.amount,
    adminNote.trim(),
    previousRefundStatus,
    'Rejected'
  );

  // Notify customer of refund rejection
  const customer = await Customer.findById(refund.user);
  if (customer) {
    await notificationService.createNotification(
      refund.user,
      'Refund Rejected',
      `Your refund request for order #${refund.order} has been rejected. Reason: ${adminNote.trim()}`,
      'refund',
      refund._id
    );

    await notificationService.sendEmailNotification(
      customer.email,
      'Refund Rejection Notice',
      `Your refund request has been rejected. Reason: ${adminNote.trim()}. Please contact support for more information.`
    );
  }

  // Create Audit Log
  await createAuditEntry(req, 'update', 'Refund', refund._id, `Status: Rejected (Reason: ${adminNote.trim()})`);

  res.status(200).json({
    success: true,
    message: 'Refund rejected successfully',
    data: refund,
  });
};

/**
 * Mark refund as processed
 * - Update status to "Processed"
 * - Set processedBy and processedAt
 * - Update Order status to "Refunded"
 */
exports.markAsProcessed = async (req, res) => {
  const { refundId } = req.params;
  const { adminNote } = req.body;

  // Fetch refund
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  // Can only process "Approved" refunds
  if (refund.status !== 'Approved') {
    throw new AppError(
      `Cannot process refund with status: ${refund.status}. Only "Approved" refunds can be processed.`,
      400
    );
  }

  // Validate refund's order still exists
  const order = await Order.findById(refund.order);
  if (!order) {
    throw new AppError('Associated order not found', 404);
  }

  // Update refund status to Processed
  const previousRefundStatus = refund.status;
  refund.status = 'Processed';
  refund.processedBy = req.user.id;
  refund.processedAt = new Date();
  if (adminNote) {
    refund.adminNote = adminNote.trim();
  }
  await refund.save();

  // Log refund action
  await StatusLogService.logRefundAction(
    refund._id,
    'processed',
    req.user.id,
    refund.amount,
    adminNote || 'Refund processed',
    previousRefundStatus,
    'Processed'
  );

  // Update order status to "Refunded"
  const oldOrderStatus = order.orderStatus;
  order.orderStatus = 'Refunded';
  await order.save();

  // Log order status change
  await StatusLogService.logOrderStatusChange(
    order._id,
    oldOrderStatus,
    'Refunded',
    req.user.id,
    'Refund Processed',
    adminNote
  );

  // Log payment log update (Manual payments JazzCash/EasyPaisa/Online transfer)
  if (refund.payment) {
    await StatusLogService.logPaymentAction(
      refund.payment,
      'refunded',
      req.user.id,
      adminNote || 'Payment refunded',
      'Verified',
      'Verified'
    );
  }

  // Notify customer of refund processing
  const customer = await Customer.findById(refund.user);
  if (customer) {
    await notificationService.createNotification(
      refund.user,
      'Refund Processed',
      `Your refund of ₹${refund.amount} for order #${refund.order} has been processed successfully`,
      'refund',
      refund._id
    );

    await notificationService.sendEmailNotification(
      customer.email,
      'Refund Processed Successfully',
      `Your refund of ₹${refund.amount} has been processed. The amount will reflect in your account within 3-5 business days.`
    );
  }

  // Create Audit Log
  await createAuditEntry(req, 'update', 'Refund', refund._id, `Status: Processed (Amt: Rs. ${refund.amount})`);

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully. Order status updated to "Refunded".',
    data: refund,
  });
};

/**
 * Get refund statistics (admin only)
 */
exports.getRefundStats = async (req, res) => {
  const stats = await Refund.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  // Format stats object
  const formattedStats = {};
  let totalRefunds = 0;
  let totalAmount = 0;

  stats.forEach((stat) => {
    formattedStats[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
    };
    totalRefunds += stat.count;
    totalAmount += stat.totalAmount;
  });

  res.status(200).json({
    success: true,
    data: {
      ...formattedStats,
      totalRefunds,
      totalAmount,
    },
  });
};
