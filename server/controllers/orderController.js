const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

/**
 * CUSTOMER ACTIONS
 */

/**
 * Place a new order
 * - Validate all items are in stock
 * - Deduct stock using inventoryService
 * - Create order with "Pending" status
 */
exports.placeOrder = async (req, res) => {
  const { orderItems, shippingAddress, phoneNumber, paymentMethod, deliveryCharge = 0 } = req.body;

  // Validation
  if (!orderItems || orderItems.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }

  if (!shippingAddress || shippingAddress.trim().length < 5) {
    throw new AppError('Valid shipping address is required (min 5 characters)', 400);
  }

  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    throw new AppError('Phone number must be a valid 10-digit number', 400);
  }

  if (!paymentMethod || !['COD', 'Online'].includes(paymentMethod)) {
    throw new AppError('Payment method must be COD or Online', 400);
  }

  // Validate and prepare order items
  let totalAmount = 0;
  const preparedItems = [];

  for (const item of orderItems) {
    if ((!item.product && !item.name) || !item.size || !item.quantity) {
      throw new AppError('Each order item must have product (or name), size, and quantity', 400);
    }

    // Fetch product (try ID first, then fallback to name lookup)
    let product = null;
    if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
      product = await Product.findById(item.product);
    } else if (item.name) {
      product = await Product.findOne({ name: { $regex: new RegExp(`^${item.name}$`, 'i') } });
    }

    if (!product) {
      throw new AppError(`Product ${item.product || item.name} not found`, 404);
    }

    if (product.isOutOfStock) {
      throw new AppError(`${product.name} is out of stock`, 400);
    }

    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        400
      );
    }

    // Get price for size
    const sizeObj = product.sizes.find((s) => s.size === item.size);
    if (!sizeObj) {
      throw new AppError(`Size ${item.size} not available for ${product.name}`, 400);
    }

    const itemPrice = sizeObj.price * item.quantity;
    totalAmount += itemPrice;

    preparedItems.push({
      product: product._id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      price: sizeObj.price,
    });

    // Deduct stock immediately
    await inventoryService.reduceStock(product._id, item.quantity);
  }

  // Calculate grand total
  const grandTotal = totalAmount + deliveryCharge;

  // Create order
  const order = await Order.create({
    customer: req.user.id,
    orderItems: preparedItems,
    shippingAddress: shippingAddress.trim(),
    phoneNumber,
    totalAmount,
    deliveryCharge,
    grandTotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    orderStatus: 'Pending',
  });

  // Notify Admin about new order
  const admins = await User.find({ role: 'admin' }).select('_id email name');
  for (const admin of admins) {
    await notificationService.createNotification(
      admin._id,
      'New Order Placed',
      `Order #${order._id} placed by customer for ₹${order.grandTotal}`,
      'order',
      order._id
    );
  }

  // Send email notification to first admin
  if (admins.length > 0) {
    const customerUser = await User.findById(req.user.id);
    await notificationService.sendEmailNotification(
      admins[0].email,
      'New Order Placed',
      `New order #${order._id} has been placed by ${customerUser.name}. Total Amount: ₹${order.grandTotal}`
    );
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
};

/**
 * Get all orders for logged-in customer
 */
exports.getMyOrders = async (req, res) => {
  const { status, sortBy = '-createdAt' } = req.query;

  // Build filter
  const filter = { customer: req.user.id };
  if (status) {
    filter.orderStatus = status;
  }

  // Get orders
  const orders = await Order.find(filter).sort(sortBy).lean();

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
};

/**
 * Cancel order
 * - Check if order can be cancelled (not "Handover to Rider" or "Delivered")
 * - Restore stock using inventoryService
 * - Set status to "Cancelled"
 */
exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const { reason = 'No reason provided' } = req.body;

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify ownership
  if (order.customer.toString() !== req.user.id) {
    throw new AppError('You can only cancel your own orders', 403);
  }

  // Check if cancellation is allowed
  if (['Handover to Rider', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
    throw new AppError(`Cannot cancel order with status: ${order.orderStatus}`, 400);
  }

  // Restore stock for all items
  for (const item of order.orderItems) {
    await inventoryService.increaseStock(item.product, item.quantity);
  }

  // Update order
  order.orderStatus = 'Cancelled';
  order.cancellationReason = reason;
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully. Stock has been restored.',
    data: order,
  });
};

/**
 * ADMIN/EMPLOYEE ACTIONS
 */

/**
 * Get all orders (with filters and pagination)
 */
exports.getAllOrders = async (req, res) => {
  const { status, customer, rider, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.orderStatus = status;
  if (customer) filter.customer = customer;
  if (rider) filter.rider = rider;

  // Pagination
  const skip = (page - 1) * limit;

  // Get orders
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter).sort(sortBy).skip(skip).limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: orders,
  });
};

/**
 * Update order status
 * - Only allow valid status transitions
 */
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  if (!orderStatus) {
    throw new AppError('Order status is required', 400);
  }

  const validStatuses = [
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready',
    'Assigned to Rider',
    'Handover to Rider',
    'Delivered',
    'Cancelled',
    'Refund Requested',
    'Refunded',
  ];

  if (!validStatuses.includes(orderStatus)) {
    throw new AppError(`Invalid order status. Valid: ${validStatuses.join(', ')}`, 400);
  }

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Prevent direct status change if already delivered or cancelled (except via refund system)
  if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
    // Allow transition to "Refund Requested" and "Refunded" from these states
    if (!['Refund Requested', 'Refunded'].includes(orderStatus)) {
      throw new AppError(`Cannot change status of ${order.orderStatus} order`, 400);
    }
  }

  // Prevent changing back from "Refunded" or "Refund Requested"
  if (['Refund Requested', 'Refunded'].includes(order.orderStatus)) {
    throw new AppError(`Cannot change status of ${order.orderStatus} order`, 400);
  }

  // PAYMENT VERIFICATION RULE: If changing to Confirmed and payment is not COD
  // Then paymentStatus must be Verified
  if (orderStatus === 'Confirmed' && order.paymentMethod !== 'COD') {
    if (order.paymentStatus !== 'Verified') {
      throw new AppError(
        `Cannot confirm order. Payment must be verified first. Current status: ${order.paymentStatus}`,
        400
      );
    }
  }

  // Update status
  const oldStatus = order.orderStatus;
  order.orderStatus = orderStatus;
  await order.save();

  // Send notifications based on status change
  const customer = await User.findById(order.customer);
  
  // Notify customer of status updates
  if (orderStatus !== 'Pending') {
    await notificationService.createNotification(
      order.customer,
      `Order ${orderStatus}`,
      `Your order #${order._id} status has been updated to ${orderStatus}`,
      'order',
      order._id
    );

    // Send email to customer
    await notificationService.sendEmailNotification(
      customer.email,
      `Order Status: ${orderStatus}`,
      `Your order #${order._id} status has been updated to ${orderStatus}.`
    );
  }

  // If assigning to rider, also notify the rider
  if (orderStatus === 'Assigned to Rider' && req.body.riderId) {
    const rider = await User.findById(req.body.riderId);
    if (rider) {
      await notificationService.createNotification(
        rider._id,
        'Order Assigned to You',
        `You have been assigned order #${order._id}. Total: ₹${order.grandTotal}`,
        'order',
        order._id
      );

      await notificationService.sendEmailNotification(
        rider.email,
        'New Order Assignment',
        `You have been assigned order #${order._id}. Please check the app for details.`
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
};

/**
 * Assign rider to order
 */
exports.assignRider = async (req, res) => {
  const { orderId } = req.params;
  const { riderId } = req.body;

  if (!riderId) {
    throw new AppError('Rider ID is required', 400);
  }

  // Verify rider exists and has rider role
  const rider = await User.findById(riderId);
  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  if (rider.role !== 'rider') {
    throw new AppError('User is not a rider', 400);
  }

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check order status (should be Ready or later)
  if (!['Ready', 'Assigned to Rider', 'Handover to Rider'].includes(order.orderStatus)) {
    throw new AppError('Order must be Ready before assigning a rider', 400);
  }

  // Assign rider
  order.rider = riderId;
  if (order.orderStatus === 'Ready') {
    order.orderStatus = 'Assigned to Rider';
  }
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Rider assigned successfully',
    data: order,
  });
};

/**
 * RIDER ACTIONS
 */

/**
 * Get all deliveries assigned to rider
 */
exports.getMyDeliveries = async (req, res) => {
  const { status = 'Assigned to Rider', sortBy = '-createdAt' } = req.query;

  const filter = {
    rider: req.user.id,
  };

  if (status) {
    filter.orderStatus = status;
  }

  const orders = await Order.find(filter).sort(sortBy);

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
};

/**
 * Update delivery status (mainly for Rider)
 * - Rider can only update status to "Delivered"
 * - Can update "Handover to Rider" to "Delivered"
 */
exports.updateDeliveryStatus = async (req, res) => {
  const { orderId } = req.params;
  const { newStatus } = req.body;

  if (!newStatus) {
    throw new AppError('New status is required', 400);
  }

  // Fetch order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify rider ownership
  if (order.rider.toString() !== req.user.id) {
    throw new AppError('You can only update your assigned deliveries', 403);
  }

  // Validate status transition
  if (newStatus === 'Delivered') {
    if (order.orderStatus !== 'Handover to Rider') {
      throw new AppError('Order must be in "Handover to Rider" status to deliver', 400);
    }
    order.orderStatus = 'Delivered';
  } else if (newStatus === 'Handover to Rider') {
    if (order.orderStatus !== 'Assigned to Rider') {
      throw new AppError('Order must be "Assigned to Rider" before handover', 400);
    }
    order.orderStatus = 'Handover to Rider';
  } else {
    throw new AppError('Invalid status. Rider can only update to "Handover to Rider" or "Delivered"', 400);
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Delivery status updated successfully',
    data: order,
  });
};

/**
 * Get single order details
 */
exports.getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify access (customer, admin, or assigned rider)
  if (
    order.customer.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'employee' &&
    order.rider?.toString() !== req.user.id
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
};
