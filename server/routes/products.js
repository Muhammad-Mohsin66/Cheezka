const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const productController = require('../controllers/productController');

// ─── Static routes MUST come before dynamic /:id routes ───────────────────────

// Admin inventory routes (static paths – must be before /:id)
router.get('/stock/low', protect, authorizeRoles('admin'), productController.getLowStockProducts);
router.get('/stock/status', protect, authorizeRoles('admin'), productController.getInventoryStatus);

// Public routes
router.get('/', productController.getAllProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin CRUD routes
router.post('/', protect, authorizeRoles('admin'), productController.createProduct);
router.put('/:id', protect, authorizeRoles('admin'), productController.updateProduct);
router.patch('/:id/stock', protect, authorizeRoles('admin'), productController.updateStock);
router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
