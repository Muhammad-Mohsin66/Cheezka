const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/auth');

/**
 * CUSTOMER ROUTES (Protected)
 */

// Place new order
router.post('/', protect, authorizeRoles('customer', 'admin'), orderController.placeOrder);

// Get my orders
router.get('/my-orders/list', protect, authorizeRoles('customer', 'admin'), orderController.getMyOrders);

// Cancel my order
router.patch('/:orderId/cancel', protect, authorizeRoles('customer', 'admin'), orderController.cancelOrder);

/**
 * ADMIN/EMPLOYEE ROUTES (Protected)
 */

// Get all orders (admin/employee only)
router.get('/admin/all', protect, authorizeRoles('admin', 'employee'), orderController.getAllOrders);

// Update order status (admin/employee only)
router.patch('/:orderId/status', protect, authorizeRoles('admin', 'employee'), orderController.updateOrderStatus);

// Assign rider to order (admin/employee only)
router.patch('/:orderId/assign-rider', protect, authorizeRoles('admin', 'employee'), orderController.assignRider);

/**
 * RIDER ROUTES (Protected)
 */

// Get my deliveries (rider only, or admin/employee to view all/specific ones)
router.get('/rider/deliveries', protect, authorizeRoles('rider', 'admin', 'employee'), orderController.getMyDeliveries);

// Update delivery status
router.patch('/:orderId/delivery-status', protect, authorizeRoles('rider', 'admin', 'employee'), orderController.updateDeliveryStatus);

/**
 * SHARED ROUTES (Protected)
 */

// Get order details (customer, admin, employee, or assigned rider)
router.get('/:orderId/details', protect, orderController.getOrderDetails);

module.exports = router;
