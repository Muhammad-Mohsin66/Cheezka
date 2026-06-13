const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const path = require('path');

/**
 * CUSTOMER ACTIONS
 */

/**
 * Upload payment screenshot
 * - Customer uploads proof of payment
 * - Creates Payment record with Pending status
 */
exports.uploadPaymentScreenshot = async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, amount } = req.body;

  // Validation
  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  if (!paymentMethod) {
    throw new AppError('Payment method is required', 400);
  }

  if (!amount) {
    throw new AppError('Amount is required', 400);
  }

  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  if (!req.file) {
    throw new AppError('Payment screenshot is required', 400);
  }

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify customer ownership
  if ((order.customer?._id || order.customer || '').toString() !== req.user.id) {
    throw new AppError('You can only upload payment for your own order', 403);
  }

  // Verify order has non-COD payment method
  if (order.paymentMethod === 'COD') {
    throw new AppError('Cash on Delivery orders do not require payment verification', 400);
  }

  // Verify amount matches order total
  if (parseFloat(amount) !== order.grandTotal) {
    throw new AppError(
      `Amount mismatch. Order total: ${order.grandTotal}, Provided: ${amount}`,
      400
    );
  }

  // Check if payment already exists and pending
  const existingPayment = await Payment.findOne({ order: orderId, status: 'Pending' });
  if (existingPayment) {
    throw new AppError('Payment verification already pending for this order', 400);
  }

  // Create payment record
  const screenshotPath = path.join('/uploads/payments', req.file.filename);

  const payment = await Payment.create({
    order: orderId,
    user: req.user.id,
    paymentMethod,
    screenshot: screenshotPath,
    amount,
    status: 'Pending',
  });

  // Notify Admin about payment upload
  const admins = await User.find({ role: 'admin' }).select('_id email name');
  for (const admin of admins) {
    await notificationService.createNotification(
      admin._id,
      'Payment Screenshot Received',
      `Payment screenshot received for order #${orderId}. Amount: ₹${amount}`,
      'payment',
      payment._id
    );
  }

  // Send email to first admin
  if (admins.length > 0) {
    await notificationService.sendEmailNotification(
      admins[0].email,
      'Payment Screenshot Pending Verification',
      `A payment screenshot has been uploaded for order #${orderId}. Amount: ₹${amount}. Please verify in the admin panel.`
    );
  }

  res.status(201).json({
    success: true,
    message: 'Payment screenshot uploaded. Awaiting admin verification.',
    data: payment,
  });
};

/**
 * Get my payments (customer view)
 */
exports.getMyPayments = async (req, res) => {
  const { status, sortBy = '-createdAt' } = req.query;

  const filter = { user: req.user.id };
  if (status) {
    filter.status = status;
  }

  const payments = await Payment.find(filter).sort(sortBy);

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
};

/**
 * ADMIN ACTIONS
 */

/**
 * Get all payments (admin view)
 */
exports.getAllPayments = async (req, res) => {
  const { status, user, order, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (user) filter.user = user;
  if (order) filter.order = order;

  // Pagination
  const skip = (page - 1) * limit;

  // Get payments
  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter).sort(sortBy).skip(skip).limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: payments,
  });
};

/**
 * Verify payment
 * - Admin verifies payment screenshot
 * - Updates Payment status to "Verified"
 * - Updates Order paymentStatus to "Verified"
 */
exports.verifyPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { adminNote = '' } = req.body;

  // Fetch payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check payment status
  if (payment.status !== 'Pending') {
    throw new AppError(`Cannot verify ${payment.status} payment`, 400);
  }

  // Update payment
  payment.status = 'Verified';
  payment.verifiedBy = req.user.id;
  payment.verifiedAt = new Date();
  if (adminNote) {
    payment.adminNote = adminNote;
  }
  await payment.save();

  // Update order payment status
  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = 'Verified';
    await order.save();
  }

  // Notify customer of payment verification
  const customer = await User.findById(payment.user);
  if (customer) {
    await notificationService.createNotification(
      payment.user,
      'Payment Verified',
      `Your payment for order #${order._id} has been verified successfully`,
      'payment',
      payment._id
    );

    await notificationService.sendEmailNotification(
      customer.email,
      'Payment Verified Successfully',
      `Your payment for order #${order._id} has been verified. Your order is now confirmed.`
    );
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: payment,
  });
};

/**
 * Reject payment
 * - Admin rejects payment screenshot
 * - Updates Payment status to "Rejected"
 * - Order remains as is (customer can resubmit)
 */
exports.rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    throw new AppError('Rejection reason is required', 400);
  }

  // Fetch payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check payment status
  if (payment.status !== 'Pending') {
    throw new AppError(`Cannot reject ${payment.status} payment`, 400);
  }

  // Update payment
  payment.status = 'Rejected';
  payment.verifiedBy = req.user.id;
  payment.verifiedAt = new Date();
  payment.adminNote = rejectionReason;
  await payment.save();

  // Notify customer of payment rejection
  const customer = await User.findById(payment.user);
  if (customer) {
    await notificationService.createNotification(
      payment.user,
      'Payment Rejected',
      `Your payment for order has been rejected. Reason: ${rejectionReason}. Please resubmit.`,
      'payment',
      payment._id
    );

    await notificationService.sendEmailNotification(
      customer.email,
      'Payment Rejection Notice',
      `Your payment has been rejected. Reason: ${rejectionReason}. Please resubmit your payment screenshot.`
    );
  }

  res.status(200).json({
    success: true,
    message: 'Payment rejected. Customer can resubmit.',
    data: payment,
  });
};

/**
 * Get payment details
 */
exports.getPaymentDetails = async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Verify access (customer, admin, or related user)
  if (
    (payment.user?._id || payment.user || '').toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'employee'
  ) {
    throw new AppError('You do not have access to this payment', 403);
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
};
