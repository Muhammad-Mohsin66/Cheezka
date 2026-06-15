const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const AppError = require('../utils/AppError');

/**
 * GET /api/inventory
 * Full inventory list with stock levels and status labels
 */
exports.getInventory = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50, all } = req.query;
    const filter = {};
    if (all !== 'true') {
      filter.isActive = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // stock status filter
    if (status === 'low') {
      filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
    } else if (status === 'out') {
      filter.stockQuantity = 0;
    } else if (status === 'ok') {
      filter.$expr = { $gt: ['$stockQuantity', '$lowStockThreshold'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ stockQuantity: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    // Annotate with stock status label
    const data = products.map((p) => {
      const obj = p.toObject();
      if (obj.stockQuantity === 0) {
        obj.stockStatus = 'out_of_stock';
      } else if (obj.stockQuantity <= obj.lowStockThreshold) {
        obj.stockStatus = 'low_stock';
      } else {
        obj.stockStatus = 'in_stock';
      }
      return obj;
    });

    res.status(200).json({ success: true, count: data.length, total, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/alerts
 * Products below low stock threshold
 */
exports.getStockAlerts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      isActive: true,
    })
      .populate('category', 'name')
      .sort({ stockQuantity: 1 });

    const data = products.map((p) => {
      const obj = p.toObject();
      obj.stockStatus = obj.stockQuantity === 0 ? 'out_of_stock' : 'low_stock';
      return obj;
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/inventory/adjust
 * Adjust stock for a product (admin only)
 * Body: { productId, action: 'increase'|'reduce'|'set', quantity, reason, notes }
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, action, quantity, reason = 'manual', notes } = req.body;

    if (!productId || !action || quantity === undefined || quantity < 0) {
      return next(new AppError('productId, action, and quantity are required', 400));
    }

    if (!['increase', 'reduce', 'set'].includes(action)) {
      return next(new AppError('action must be: increase, reduce, or set', 400));
    }

    const product = await Product.findById(productId);
    if (!product) return next(new AppError('Product not found', 404));

    const previousStock = product.stockQuantity;
    let newStock;

    if (action === 'increase') {
      newStock = previousStock + parseInt(quantity);
    } else if (action === 'reduce') {
      if (previousStock < quantity) {
        return next(new AppError(`Cannot reduce. Only ${previousStock} units in stock`, 400));
      }
      newStock = previousStock - parseInt(quantity);
    } else {
      // set
      newStock = parseInt(quantity);
    }

    product.stockQuantity = newStock;
    await product.save();

    // Log the change
    await InventoryLog.create({
      product: product._id,
      changeType: action === 'reduce' ? 'decrease' : 'increase',
      quantity: Math.abs(newStock - previousStock),
      reason,
      performedBy: req.user.id,
      previousStock,
      newStock,
      notes: notes || '',
    });

    await product.populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { product, previousStock, newStock, change: newStock - previousStock },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/logs
 * Full inventory change log with optional filters
 */
exports.getInventoryLogs = async (req, res, next) => {
  try {
    const { productId, reason, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (productId) filter.product = productId;
    if (reason) filter.reason = reason;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      InventoryLog.find(filter)
        .populate('product', 'name image')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InventoryLog.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, count: logs.length, total, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/summary
 * Quick summary counts for dashboard widget
 */
exports.getInventorySummary = async (req, res, next) => {
  try {
    const { all } = req.query;
    const activeFilter = all === 'true' ? {} : { isActive: true };

    const [totalProducts, lowStock, outOfStock, inStock] = await Promise.all([
      Product.countDocuments({ ...activeFilter }),
      Product.countDocuments({ $expr: { $and: [{ $gt: ['$stockQuantity', 0] }, { $lte: ['$stockQuantity', '$lowStockThreshold'] }] }, ...activeFilter }),
      Product.countDocuments({ stockQuantity: 0, ...activeFilter }),
      Product.countDocuments({ $expr: { $gt: ['$stockQuantity', '$lowStockThreshold'] }, ...activeFilter }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalProducts, lowStock, outOfStock, inStock },
    });
  } catch (error) {
    next(error);
  }
};
