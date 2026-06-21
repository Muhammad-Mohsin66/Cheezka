const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Rider = require('../models/Rider');
const Employee = require('../models/Employee');
const OrderStatusLog = require('../models/OrderStatusLog');
const Refund = require('../models/Refund');
const InventoryLog = require('../models/InventoryLog');
const SystemSetting = require('../models/SystemSetting');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const StatusLogService = require('../services/statusLogService');
const { createAuditEntry } = require('./auditLogController');
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
  const { orderItems, shippingAddress, phoneNumber, paymentMethod, deliveryCharge } = req.body;

  // Validation
  if (!orderItems || orderItems.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }

  if (!shippingAddress || shippingAddress.trim().length < 5) {
    throw new AppError('Valid shipping address is required (min 5 characters)', 400);
  }

  if (!phoneNumber || !/^\d{11}$/.test(phoneNumber)) {
    throw new AppError('Phone number must be a valid 11-digit number', 400);
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
      const escapedName = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      product = await Product.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
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
  }

  // Fetch dynamic settings
  const settings = await SystemSetting.find({ key: { $in: ['MIN_ORDER_VALUE', 'TAX_PERCENTAGE', 'DELIVERY_BASE_CHARGE'] } });
  const minOrderSetting = settings.find(s => s.key === 'MIN_ORDER_VALUE');
  const taxSetting = settings.find(s => s.key === 'TAX_PERCENTAGE');
  const deliverySetting = settings.find(s => s.key === 'DELIVERY_BASE_CHARGE');
  
  const minOrderValue = minOrderSetting ? Number(minOrderSetting.value) : 0;
  const taxPercentage = taxSetting ? Number(taxSetting.value) : 0;
  const defaultDeliveryCharge = deliverySetting && deliverySetting.value !== undefined ? Number(deliverySetting.value) : 100;

  if (minOrderValue > 0 && totalAmount < minOrderValue) {
    throw new AppError(`Minimum order value is Rs. ${minOrderValue}. Please add more items.`, 400);
  }

  const taxAmount = Math.round(totalAmount * (taxPercentage / 100));

  // Deduct stock and collect log IDs
  const logIds = [];
  for (const item of preparedItems) {
    const updatedProduct = await inventoryService.reduceStock(item.product, item.quantity, {
      performedBy: req.user.id,
      reason: 'order',
      notes: `Ordered size ${item.size}`
    });
    if (updatedProduct && updatedProduct.lastLog) {
      logIds.push(updatedProduct.lastLog._id);
    }
  }

  // Calculate grand total
  const finalDeliveryCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : defaultDeliveryCharge;
  const grandTotal = totalAmount + finalDeliveryCharge + taxAmount;

  // Create order
  const order = await Order.create({
    customer: req.user.id,
    orderItems: preparedItems,
    shippingAddress: shippingAddress.trim(),
    phoneNumber,
    totalAmount,
    taxAmount,
    deliveryCharge: finalDeliveryCharge,
    grandTotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
    orderStatus: 'Pending',
  });

  // Link created inventory logs to the order
  if (logIds.length > 0) {
    await InventoryLog.updateMany(
      { _id: { $in: logIds } },
      { relatedOrder: order._id }
    );
  }

  // Log order status change
  await StatusLogService.logOrderStatusChange(
    order._id,
    null,
    'Pending',
    req.user.id,
    'Order placed',
    `Order placed by customer via ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}`
  );

  // Create order notification for customer
  await notificationService.createNotification(
    req.user.id,
    'Order Placed Successfully',
    `Your order #${order._id} has been placed successfully. Grand Total: Rs. ${order.grandTotal}`,
    'order',
    order._id
  );

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
    const customerUser = await Customer.findById(req.user.id);
    await notificationService.sendEmailNotification(
      admins[0].email,
      'New Order Placed',
      `New order #${order._id} has been placed by ${customerUser.name}. Total Amount: Rs. ${order.grandTotal}`
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
  const orders = await Order.find(filter)
    .sort(sortBy)
    .populate('customer', 'name phone email')
    .populate('rider', 'name phone email')
    .lean();

  // Fetch associated refund request details if any
  const refunds = await Refund.find({ user: req.user.id }).lean();
  const refundsMap = refunds.reduce((map, r) => {
    if (r.order) {
      map[r.order.toString()] = r;
    }
    return map;
  }, {});

  const ordersWithRefund = orders.map(order => ({
    ...order,
    refund: refundsMap[order._id.toString()] || null
  }));

  res.status(200).json({
    success: true,
    count: orders.length,
    data: ordersWithRefund,
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
  if ((order.customer?._id || order.customer || '').toString() !== req.user.id) {
    throw new AppError('You can only cancel your own orders', 403);
  }

  // Check if cancellation is allowed
  if (['Handover to Rider', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
    throw new AppError(`Cannot cancel order with status: ${order.orderStatus}`, 400);
  }

  // Restore stock for all items
  for (const item of order.orderItems) {
    await inventoryService.increaseStock(item.product, item.quantity, {
      performedBy: req.user.id,
      reason: 'cancel',
      relatedOrder: order._id,
      notes: `Order #${order._id} cancelled by customer`
    });
  }

  // Update order
  const oldStatus = order.orderStatus;
  order.orderStatus = 'Cancelled';
  order.cancellationReason = reason;
  await order.save();

  // Log order status change
  await StatusLogService.logOrderStatusChange(
    order._id,
    oldStatus,
    'Cancelled',
    req.user.id,
    'Cancelled by Customer',
    reason
  );

  // Create notifications
  await notificationService.createNotification(
    req.user.id,
    'Order Cancelled',
    `Your order #${order._id} has been cancelled successfully.`,
    'order',
    order._id
  );

  const admins = await User.find({ role: 'admin' }).select('_id email name');
  for (const admin of admins) {
    await notificationService.createNotification(
      admin._id,
      'Order Cancelled by Customer',
      `Order #${order._id} has been cancelled by the customer. Reason: ${reason}`,
      'order',
      order._id
    );
  }

  await createAuditEntry(req, 'update', 'Order', order._id, `Status: Cancelled`);

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

  // PAYMENT VERIFICATION RULE: If progressing order status and payment is not COD
  // Then paymentStatus must be Verified
  const progressionStatuses = ['Confirmed', 'Preparing', 'Ready', 'Assigned to Rider', 'Handover to Rider', 'Delivered'];
  if (progressionStatuses.includes(orderStatus) && order.paymentMethod !== 'COD') {
    if (order.paymentStatus !== 'Verified') {
      throw new AppError(
        `Cannot change status to ${orderStatus}. Online payment must be verified first. Current payment status: ${order.paymentStatus}`,
        400
      );
    }
  }

  // If changing status to Cancelled, restore stock
  if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
    for (const item of order.orderItems) {
      await inventoryService.increaseStock(item.product, item.quantity, {
        performedBy: req.user.id,
        reason: 'cancel',
        relatedOrder: order._id,
        notes: `Order status changed to Cancelled by staff/admin`
      });
    }
  }

  // Update status
  const oldStatus = order.orderStatus;
  order.orderStatus = orderStatus;

  // Auto-verify COD payments when delivered
  if (orderStatus === 'Delivered' && order.paymentMethod === 'COD') {
    order.paymentStatus = 'Verified';
  }

  await order.save();

  // Log order status change
  await StatusLogService.logOrderStatusChange(
    order._id,
    oldStatus,
    orderStatus,
    req.user.id,
    req.body.reason || `Status updated by store staff to ${orderStatus}`,
    req.body.notes || ''
  );

  // Send notifications based on status change
  const customer = order.customer && order.customer.email ? order.customer : await Customer.findById(order.customer);
  const customerId = order.customer?._id || order.customer;
  
  // Notify customer of status updates
  if (orderStatus !== 'Pending' && customer) {
    await notificationService.createNotification(
      customerId,
      `Order ${orderStatus}`,
      `Your order #${order._id} status has been updated to ${orderStatus}`,
      'order',
      order._id
    );

    // Send email to customer
    if (customer.email) {
      await notificationService.sendEmailNotification(
        customer.email,
        `Order Status: ${orderStatus}`,
        `Your order #${order._id} status has been updated to ${orderStatus}.`
      );
    }
  }

  // If assigning to rider, also notify the rider
  if (orderStatus === 'Assigned to Rider' && req.body.riderId) {
  const rider = await Rider.findById(req.body.riderId);
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

  await createAuditEntry(req, 'update', 'Order', order._id, `Status: ${orderStatus}`);

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
  const rider = await Rider.findById(riderId);
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

  const oldStatus = order.orderStatus;

  // Assign rider
  order.rider = riderId;
  if (order.orderStatus === 'Ready') {
    order.orderStatus = 'Assigned to Rider';
  }
  await order.save();

  // Log order status change if status changed
  if (oldStatus !== order.orderStatus) {
    await StatusLogService.logOrderStatusChange(
      order._id,
      oldStatus,
      order.orderStatus,
      req.user.id,
      `Status updated by store staff to ${order.orderStatus}`,
      ''
    );
  }

  // Send notifications based on status change and assignment
  const customer = order.customer && order.customer.email ? order.customer : await Customer.findById(order.customer);
  const customerId = order.customer?._id || order.customer;

  // Notify customer
  if (customer) {
    await notificationService.createNotification(
      customerId,
      `Order Assigned to Rider`,
      `A rider has been assigned to your order #${order._id}. Status: ${order.orderStatus}`,
      'order',
      order._id
    );

    if (customer.email) {
      await notificationService.sendEmailNotification(
        customer.email,
        `Order Assigned to Rider`,
        `A rider has been assigned to your order #${order._id}. Status: ${order.orderStatus}`
      );
    }
  }

  // Notify rider
  await notificationService.createNotification(
    rider._id,
    'Order Assigned to You',
    `You have been assigned order #${order._id}. Total: Rs. ${order.grandTotal}`,
    'order',
    order._id
  );

  if (rider.email) {
    await notificationService.sendEmailNotification(
      rider.email,
      'New Order Assignment',
      `You have been assigned order #${order._id}. Please check the app for details.`
    );
  }

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
  const { status, sortBy = '-createdAt' } = req.query;

  const filter = {};
  if (req.user.role === 'admin' || req.user.role === 'employee') {
    // Show all deliveries that have a rider assigned OR are already delivered (e.g. manual status updates)
    if (status) {
      filter.$and = [
        { $or: [{ rider: { $ne: null } }, { orderStatus: 'Delivered' }] },
        { orderStatus: status }
      ];
    } else {
      filter.$or = [
        { rider: { $ne: null }, orderStatus: { $in: ['Assigned to Rider', 'Handover to Rider', 'Delivered'] } },
        { orderStatus: 'Delivered' }
      ];
    }
  } else {
    // Show only the logged-in rider's deliveries
    filter.rider = req.user.id;
    if (status) {
      filter.orderStatus = status;
    } else {
      filter.orderStatus = { $in: ['Assigned to Rider', 'Handover to Rider', 'Delivered'] };
    }
  }

  const orders = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('rider', 'name email phone')
    .sort(sortBy);

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

  // Verify rider ownership (bypass for admins and employees)
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    if ((order.rider?._id || order.rider || '').toString() !== req.user.id) {
      throw new AppError('You can only update your assigned deliveries', 403);
    }
  }

  // Validate status transition
  const oldStatus = order.orderStatus;
  if (newStatus === 'Delivered') {
    if (order.orderStatus !== 'Handover to Rider' && order.orderStatus !== 'Assigned to Rider') {
      throw new AppError('Order must be in "Handover to Rider" or "Assigned to Rider" status to deliver', 400);
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

  // Auto-verify COD payments when delivered
  if (newStatus === 'Delivered' && order.paymentMethod === 'COD') {
    order.paymentStatus = 'Verified';
  }

  await order.save();

  await StatusLogService.logOrderStatusChange(
    order._id,
    oldStatus,
    newStatus,
    req.user.id,
    req.body.reason || (req.user.role === 'rider' ? `Status updated by rider to ${newStatus}` : `Status updated by staff to ${newStatus}`),
    req.body.notes || ''
  );

  // Notify customer of delivery updates
  const customerId = order.customer?._id || order.customer;
  const customer = order.customer && order.customer.email ? order.customer : await Customer.findById(order.customer);
  if (customerId) {
    let title = '';
    let message = '';
    if (newStatus === 'Handover to Rider') {
      title = 'Order Out for Delivery';
      message = `Your order #${order._id} has been picked up by the rider and is on the way!`;
    } else if (newStatus === 'Delivered') {
      title = 'Order Delivered';
      message = `Your order #${order._id} has been successfully delivered. Enjoy your meal!`;
    }

    if (title && message) {
      await notificationService.createNotification(
        customerId,
        title,
        message,
        'order',
        order._id
      );

      if (customer && customer.email) {
        await notificationService.sendEmailNotification(
          customer.email,
          title,
          message
        );
      }
    }
  }

  await createAuditEntry(req, 'update', 'Order', order._id, `Delivery Status: ${newStatus}`);

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

  const order = await Order.findById(orderId)
    .populate('customer', 'name phone email')
    .populate('rider', 'name phone email');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify access (customer, admin, or assigned rider)
  const orderCustomerId = (order.customer?._id || order.customer || '').toString();
  const orderRiderId = (order.rider?._id || order.rider || '').toString();

  if (
    orderCustomerId !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'employee' &&
    orderRiderId !== req.user.id
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  // Fetch status history logs
  const statusHistory = await OrderStatusLog.find({ order: orderId })
    .sort({ createdAt: -1 })
    .populate('changedBy', 'name role')
    .lean();

  // Fetch associated refund if any
  const refund = await Refund.findOne({ order: orderId }).lean();

  res.status(200).json({
    success: true,
    data: {
      ...order.toObject(),
      refund: refund || null
    },
    statusHistory,
  });
};
