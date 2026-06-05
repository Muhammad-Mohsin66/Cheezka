const Product = require('../models/Product');
const AppError = require('../utils/AppError');

/**
 * Reduce stock quantity for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to reduce
 * @returns {Promise<Object>} Updated product
 */
exports.reduceStock = async (productId, quantity) => {
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

  product.stockQuantity -= quantity;

  // Pre-save middleware will automatically set isOutOfStock
  await product.save();

  return product;
};

/**
 * Increase stock quantity for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to increase
 * @returns {Promise<Object>} Updated product
 */
exports.increaseStock = async (productId, quantity) => {
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

  product.stockQuantity += quantity;

  // Pre-save middleware will automatically update isOutOfStock
  await product.save();

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
