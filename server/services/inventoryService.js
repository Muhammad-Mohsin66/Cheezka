const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Reduce stock quantity for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to reduce
 * @param {Object} options - Logging context (performedBy, reason, relatedOrder, notes)
 * @returns {Promise<Object>} Updated product
 */
exports.reduceStock = async (productId, quantity, options = {}) => {
  if (!productId || !quantity) {
    throw new AppError('Product ID and quantity are required', 400);
  }

  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.stockQuantity < quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`,
      400
    );
  }

  const previousStock = product.stockQuantity;
  product.stockQuantity -= quantity;

  // Pre-save middleware will automatically set isOutOfStock
  await product.save();

  // Determine performedBy (fallback to admin user if not provided)
  let performedBy = options.performedBy;
  if (!performedBy) {
    const admin = await User.findOne({ role: 'admin' });
    if (admin) performedBy = admin._id;
  }

  let log = null;
  if (performedBy) {
    log = await InventoryLog.create({
      product: product._id,
      changeType: 'decrease',
      quantity,
      reason: options.reason || 'manual',
      relatedOrder: options.relatedOrder || null,
      performedBy,
      previousStock,
      newStock: product.stockQuantity,
      notes: options.notes || '',
    });
  }

  product.lastLog = log;
  return product;
};

/**
 * Increase stock quantity for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to increase
 * @param {Object} options - Logging context (performedBy, reason, relatedOrder, notes)
 * @returns {Promise<Object>} Updated product
 */
exports.increaseStock = async (productId, quantity, options = {}) => {
  if (!productId || !quantity) {
    throw new AppError('Product ID and quantity are required', 400);
  }

  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const previousStock = product.stockQuantity;
  product.stockQuantity += quantity;

  // Pre-save middleware will automatically update isOutOfStock
  await product.save();

  // Determine performedBy (fallback to admin user if not provided)
  let performedBy = options.performedBy;
  if (!performedBy) {
    const admin = await User.findOne({ role: 'admin' });
    if (admin) performedBy = admin._id;
  }

  let log = null;
  if (performedBy) {
    log = await InventoryLog.create({
      product: product._id,
      changeType: 'increase',
      quantity,
      reason: options.reason || 'manual',
      relatedOrder: options.relatedOrder || null,
      performedBy,
      previousStock,
      newStock: product.stockQuantity,
      notes: options.notes || '',
    });
  }

  product.lastLog = log;
  return product;
};

/**
 * Check for products with low stock
 * @returns {Promise<Array>} Array of products with low stock
 */
exports.checkLowStock = async () => {
  const lowStockProducts = await Product.find({
    $expr: {
      $and: [
        { $gt: ['$stockQuantity', 0] },
        { $lte: ['$stockQuantity', '$lowStockThreshold'] }
      ]
    },
    isActive: true
  }).populate('category', 'name');

  return lowStockProducts;
};

/**
 * Get stock status for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Stock status information
 */
exports.getStockStatus = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return {
    productId: product._id,
    productName: product.name,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    isOutOfStock: product.isOutOfStock,
    isLowStock: product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0,
    status:
      product.stockQuantity === 0
        ? 'Out of Stock'
        : product.stockQuantity <= product.lowStockThreshold
          ? 'Low Stock'
          : 'In Stock'
  };
};

/**
 * Get overall inventory status
 * @returns {Promise<Object>} Overall inventory metrics
 */
exports.getInventoryStatus = async () => {
  const totalProducts = await Product.countDocuments({ isActive: true });
  const outOfStock = await Product.countDocuments({ isOutOfStock: true, isActive: true });
  const lowStockCount = await Product.countDocuments({
    $expr: {
      $and: [
        { $gt: ['$stockQuantity', 0] },
        { $lte: ['$stockQuantity', '$lowStockThreshold'] }
      ]
    },
    isActive: true
  });

  const totalQuantity = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: '$stockQuantity' } } }
  ]);

  return {
    totalProducts,
    outOfStockCount: outOfStock,
    lowStockCount: lowStockCount,
    inStockCount: totalProducts - outOfStock,
    totalQuantityInStock: totalQuantity[0]?.total || 0
  };
};
