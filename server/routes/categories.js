const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.post('/', protect, authorizeRoles('admin'), categoryController.createCategory);
router.put('/:id', protect, authorizeRoles('admin'), categoryController.updateCategory);
router.delete('/:id', protect, authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;
