/**
 * UPDATED CONTROLLER SNIPPETS
 * Shows how to integrate new logging services into existing controllers
 * Copy and adapt these patterns into your existing controllers
 */

// ========================================
// 1. ORDER CONTROLLER UPDATES
// ========================================

/**
 * Updated placeOrder - with inventory logging
 * Add this to orderController.js
 */
const InventoryLogService = require('../services/inventoryLogService');
const StatusLogService = require('../services/statusLogService');

// In placeOrder function, after creating order:
const handleOrderPlacement = async (req, res) => {
  // ... existing order validation code ...

  const order = await Order.create({
    customer: req.user._id,
    items: preparedItems,
    totalAmount,
    status: 'Pending',
    shippingAddress: req.body.shippingAddress,
    phoneNumber: req.body.phoneNumber,
    paymentMethod: req.body.paymentMethod,
  });

  // NEW: Log initial status
  await StatusLogService.logOrderStatusChange(
    order._id,
    null,
    'Pending',
    req.user._id,
    'Order placed',
    null
  );

  // NEW: Log inventory changes for each item
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    await InventoryLogService.logOrderInventoryChange(
      item.product,
      item.quantity,
      order._id,
      req.user._id
    );
  }

  res.status(201).json({ success: true, order });
};

// ========================================
// Updated updateOrderStatus - with status logging
// ========================================

const handleUpdateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, reason, notes } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const previousStatus = order.status;

  // Update order
  order.status = status;
  await order.save();

  // NEW: Log status change
  await StatusLogService.logOrderStatusChange(
    orderId,
    previousStatus,
    status,
    req.user._id,
    reason || null,
    notes || null
  );

  // NEW: If cancellation, return inventory
  if (previousStatus !== 'Cancelled' && status === 'Cancelled') {
    for (const item of order.items) {
      await InventoryLogService.logCancellationInventoryReturn(
        item.product,
        item.quantity,
        orderId,
        req.user._id
      );
    }
  }

  res.json({ success: true, order });
};

// ========================================
// 2. PAYMENT CONTROLLER UPDATES
// ========================================

const StatusLogService = require('../services/statusLogService');

// Updated verifyPayment - with payment logging
const handleVerifyPayment = async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const previousStatus = payment.status;

  // Verify payment logic here
  payment.status = 'Verified';
  payment.verifiedAt = new Date();
  payment.verifiedBy = req.user._id;
  await payment.save();

  // NEW: Log payment verification
  await StatusLogService.logPaymentAction(
    paymentId,
    'verified',
    req.user._id,
    'Payment verified successfully',
    previousStatus,
    'Verified'
  );

  res.json({ success: true, payment });
};

// Updated rejectPayment - with logging
const handleRejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const previousStatus = payment.status;

  payment.status = 'Rejected';
  payment.rejectionReason = reason;
  payment.rejectedAt = new Date();
  payment.rejectedBy = req.user._id;
  await payment.save();

  // NEW: Log payment rejection
  await StatusLogService.logPaymentAction(
    paymentId,
    'rejected',
    req.user._id,
    reason || 'Payment rejected',
    previousStatus,
    'Rejected'
  );

  res.json({ success: true, payment });
};

// ========================================
// 3. REFUND CONTROLLER UPDATES
// ========================================

const StatusLogService = require('../services/statusLogService');

// Updated approveRefund - with logging
const handleApproveRefund = async (req, res) => {
  const { refundId } = req.params;
  const { note } = req.body;

  const refund = await Refund.findById(refundId);
  if (!refund) {
    return res.status(404).json({ message: 'Refund not found' });
  }

  const previousStatus = refund.status;

  refund.status = 'Approved';
  refund.approvedAt = new Date();
  refund.approvedBy = req.user._id;
  await refund.save();

  // NEW: Log refund approval
  await StatusLogService.logRefundAction(
    refundId,
    'approved',
    req.user._id,
    refund.amount,
    note || 'Refund approved',
    previousStatus,
    'Approved'
  );

  res.json({ success: true, refund });
};

// Updated rejectRefund - with logging
const handleRejectRefund = async (req, res) => {
  const { refundId } = req.params;
  const { reason } = req.body;

  const refund = await Refund.findById(refundId);
  if (!refund) {
    return res.status(404).json({ message: 'Refund not found' });
  }

  const previousStatus = refund.status;

  refund.status = 'Rejected';
  refund.rejectionReason = reason;
  refund.rejectedAt = new Date();
  refund.rejectedBy = req.user._id;
  await refund.save();

  // NEW: Log refund rejection
  await StatusLogService.logRefundAction(
    refundId,
    'rejected',
    req.user._id,
    0,
    reason || 'Refund rejected',
    previousStatus,
    'Rejected'
  );

  res.json({ success: true, refund });
};

// Updated processRefund - with logging
const handleProcessRefund = async (req, res) => {
  const { refundId } = req.params;

  const refund = await Refund.findById(refundId);
  if (!refund) {
    return res.status(404).json({ message: 'Refund not found' });
  }

  const previousStatus = refund.status;

  refund.status = 'Processed';
  refund.processedAt = new Date();
  refund.processedBy = req.user._id;
  await refund.save();

  // NEW: Log refund processing
  await StatusLogService.logRefundAction(
    refundId,
    'processed',
    req.user._id,
    refund.amount,
    'Refund processed successfully',
    previousStatus,
    'Processed'
  );

  res.json({ success: true, refund });
};

// ========================================
// 4. PRODUCT CONTROLLER UPDATES
// ========================================

const AuditLogService = require('../services/auditLogService');

// Updated createProduct - with audit logging
const handleCreateProduct = async (req, res) => {
  const { name, description, price, category, image } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    image,
  });

  // NEW: Log product creation (audit)
  await AuditLogService.logProductCreate(
    req.user._id,
    product,
    req.ip,
    req.get('user-agent')
  );

  res.status(201).json({ success: true, product });
};

// Updated updateProduct - with audit logging
const handleUpdateProduct = async (req, res) => {
  const { productId } = req.params;
  const updates = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Store original data
  const originalData = product.toObject();

  // Update product
  Object.assign(product, updates);
  await product.save();

  // NEW: Log product update (audit) - only changed fields
  const changedFields = {};
  Object.keys(updates).forEach((key) => {
    if (originalData[key] !== updates[key]) {
      changedFields[key] = { before: originalData[key], after: updates[key] };
    }
  });

  if (Object.keys(changedFields).length > 0) {
    await AuditLogService.logProductUpdate(
      req.user._id,
      productId,
      product.name,
      originalData,
      product.toObject(),
      req.ip,
      req.get('user-agent')
    );
  }

  res.json({ success: true, product });
};

// Updated deleteProduct - with audit logging
const handleDeleteProduct = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const productName = product.name;
  await Product.findByIdAndDelete(productId);

  // NEW: Log product deletion (audit)
  await AuditLogService.logProductDelete(
    req.user._id,
    productId,
    productName,
    req.ip,
    req.get('user-agent')
  );

  res.json({ success: true, message: 'Product deleted' });
};

// ========================================
// 5. INVENTORY CONTROLLER UPDATES
// ========================================

const InventoryLogService = require('../services/inventoryLogService');

// Manually adjust inventory - with logging
const handleAdjustInventory = async (req, res) => {
  const { productId } = req.params;
  const { quantity, changeType, notes } = req.body; // changeType: 'increase' or 'decrease'

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const previousStock = product.stock || 0;
  const newStock = changeType === 'increase' ? previousStock + quantity : previousStock - quantity;

  // Validate new stock
  if (newStock < 0) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  // Update product stock
  product.stock = newStock;
  await product.save();

  // NEW: Log inventory adjustment
  await InventoryLogService.logManualAdjustment(
    productId,
    quantity,
    changeType,
    req.user._id,
    notes || null
  );

  res.json({ success: true, product });
};

// ========================================
// IMPLEMENTATION NOTES:
// ========================================
/*
1. Add these service requires at the top of each controller file
2. Call the logging services after successful operations
3. Include request metadata (IP, user-agent) for audit trails
4. Keep logging asynchronous - don't wait for log completion before responding
5. Handle logging errors gracefully - log errors but don't fail the main operation
6. For status logs, capture both previous and new status
7. For audit logs, capture both before and after states for updates
*/

module.exports = {
  handleOrderPlacement,
  handleUpdateOrderStatus,
  handleVerifyPayment,
  handleRejectPayment,
  handleApproveRefund,
  handleRejectRefund,
  handleProcessRefund,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleAdjustInventory,
};
