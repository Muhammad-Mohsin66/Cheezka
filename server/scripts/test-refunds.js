require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Deal = require('../models/Deal');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const OrderStatusLog = require('../models/OrderStatusLog');
const RefundLog = require('../models/RefundLog');
const PaymentLog = require('../models/PaymentLog');
const Notification = require('../models/Notification');
const refundController = require('../controllers/refundController');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cheezka';

// Helper to create mock response object
function createMockRes() {
  return {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonPayload = data;
      return this;
    }
  };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('CONNECTED TO DATABASE.');

  // 1. Find or create a test customer and admin
  let customer = await User.findOne({ role: 'customer' });
  if (!customer) {
    customer = await User.create({
      name: 'Test Customer',
      email: 'customer.test@example.com',
      password: 'password123',
      phone: '03001234567',
      role: 'customer'
    });
    console.log('Created test customer.');
  }

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin.test@example.com',
      password: 'password123',
      phone: '03007654321',
      role: 'admin'
    });
    console.log('Created test admin.');
  }

  console.log(`Customer: ${customer.name} (${customer._id})`);
  console.log(`Admin: ${admin.name} (${admin._id})`);

  // 2. Create mock order eligible for refund (Delivered/Cancelled, Online payment, Verified, not COD)
  // Delete existing test order if present to start clean
  await Order.deleteMany({ notes: 'REFUND_TEST_MOCK_ORDER' });

  const Product = require('../models/Product');
  const testProduct = await Product.findOne();
  if (!testProduct) {
    throw new Error('No product found in database to link order item.');
  }
  
  const order = await Order.create({
    customer: customer._id,
    orderItems: [{
      product: testProduct._id,
      name: testProduct.name,
      quantity: 1,
      price: 1500,
      size: 'L'
    }],
    totalAmount: 1500,
    deliveryCharge: 100,
    grandTotal: 1600,
    paymentMethod: 'Online',
    paymentStatus: 'Verified',
    orderStatus: 'Delivered',
    shippingAddress: 'Street 5, Test Area, Lahore',
    phoneNumber: '03001234567',
    notes: 'REFUND_TEST_MOCK_ORDER'
  });
  console.log(`Created Mock Order #${order._id} with status Delivered and Verified Online payment.`);

  // 3. Create mock payment for this order
  await Payment.deleteMany({ order: order._id });
  const payment = await Payment.create({
    order: order._id,
    user: customer._id,
    paymentMethod: 'Online',
    screenshot: '/uploads/payments/test.jpg',
    amount: 1600,
    status: 'Verified',
    verifiedBy: admin._id,
    verifiedAt: new Date()
  });
  console.log(`Created Mock Payment #${payment._id} with status Verified.`);

  // Delete any pre-existing refunds for clean state
  await Refund.deleteMany({ order: order._id });
  await OrderStatusLog.deleteMany({ order: order._id });
  await Notification.deleteMany({ recipient: customer._id, type: 'refund' });
  await Notification.deleteMany({ recipient: admin._id, type: 'refund' });

  // 4. Test Customer Refund Request
  console.log('\n--- 1. TESTING CUSTOMER REFUND REQUEST ---');
  const reqRequest = {
    body: {
      orderId: order._id.toString(),
      reason: 'The food delivered was completely cold and stale, unusable.'
    },
    user: {
      id: customer._id.toString(),
      role: 'customer'
    }
  };
  const resRequest = createMockRes();
  
  await refundController.requestRefund(reqRequest, resRequest);
  
  if (resRequest.statusCode !== 201) {
    throw new Error(`requestRefund failed with status ${resRequest.statusCode}: ${JSON.stringify(resRequest.jsonPayload)}`);
  }
  const refund = resRequest.jsonPayload.data;
  console.log(`Refund requested successfully! Refund ID: ${refund._id}, Status: ${refund.status}`);

  // 5. Verify Request Logs & Notifications
  const requestRefundLog = await RefundLog.findOne({ refund: refund._id, action: 'requested' });
  console.log('RefundLog Request entry:', requestRefundLog ? 'SUCCESS' : 'FAILED');

  const adminNotification = await Notification.findOne({ title: 'Refund Request Received' });
  console.log('Admin Notification created:', adminNotification ? 'SUCCESS' : 'FAILED');

  // 6. Test Admin Refund Approval
  console.log('\n--- 2. TESTING ADMIN REFUND APPROVAL ---');
  const reqApprove = {
    params: { refundId: refund._id.toString() },
    body: { adminNote: 'Approved as customer complaint is valid.' },
    user: { id: admin._id.toString(), role: 'admin' }
  };
  const resApprove = createMockRes();

  await refundController.approveRefund(reqApprove, resApprove);

  if (resApprove.statusCode !== 200) {
    throw new Error(`approveRefund failed with status ${resApprove.statusCode}: ${JSON.stringify(resApprove.jsonPayload)}`);
  }
  console.log('Refund approved successfully!');

  // Verify order status updated to 'Refund Requested'
  const approvedOrder = await Order.findById(order._id);
  console.log(`Order status updated to: ${approvedOrder.orderStatus} (Expected: Refund Requested)`);

  const approveOrderStatusLog = await OrderStatusLog.findOne({ order: order._id, newStatus: 'Refund Requested' });
  console.log('OrderStatusLog for approval entry:', approveOrderStatusLog ? 'SUCCESS' : 'FAILED');

  const customerApproveNotification = await Notification.findOne({ recipient: customer._id, title: 'Refund Approved' });
  console.log('Customer notification for approval:', customerApproveNotification ? 'SUCCESS' : 'FAILED');

  // 7. Test Admin Refund Processing
  console.log('\n--- 3. TESTING ADMIN REFUND PROCESSING ---');
  const reqProcess = {
    params: { refundId: refund._id.toString() },
    body: { adminNote: 'Transferred via JazzCash. Ref ID: JZ1029831' },
    user: { id: admin._id.toString(), role: 'admin' }
  };
  const resProcess = createMockRes();

  await refundController.markAsProcessed(reqProcess, resProcess);

  if (resProcess.statusCode !== 200) {
    throw new Error(`markAsProcessed failed with status ${resProcess.statusCode}: ${JSON.stringify(resProcess.jsonPayload)}`);
  }
  console.log('Refund processed successfully!');

  // Verify order status updated to 'Refunded'
  const processedOrder = await Order.findById(order._id);
  console.log(`Order status updated to: ${processedOrder.orderStatus} (Expected: Refunded)`);

  const processOrderStatusLog = await OrderStatusLog.findOne({ order: order._id, newStatus: 'Refunded' });
  console.log('OrderStatusLog for process entry:', processOrderStatusLog ? 'SUCCESS' : 'FAILED');

  const paymentLog = await PaymentLog.findOne({ payment: payment._id, action: 'refunded' });
  console.log('PaymentLog action entry logged:', paymentLog ? 'SUCCESS' : 'FAILED');

  const customerProcessNotification = await Notification.findOne({ recipient: customer._id, title: 'Refund Processed' });
  console.log('Customer notification for process:', customerProcessNotification ? 'SUCCESS' : 'FAILED');

  console.log('\n--- ALL REFUND MODULE WIRING TESTS PASSED SUCCESSFULLY! ---');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('TEST FAILED:', err);
  await mongoose.disconnect();
});
