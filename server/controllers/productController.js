const Product = require('../models/Product');
const Category = require('../models/Category');
const inventoryService = require('../services/inventoryService');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('./auditLogController');

/**
 * Create a new product (Admin only)
 * @route POST /api/products
 * @access Private (Admin)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const fs = require("fs"); fs.writeFileSync("last_payload.txt", JSON.stringify(req.body)); const { name, description, category, basePrice, sizes, isDeal, dealItems, stockQuantity, lowStockThreshold, image } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return next(new AppError('Product name is required', 400));
    }

    if (!category) {
      return next(new AppError('Category is required', 400));
    }

    if (!basePrice || basePrice < 0) {
      return next(new AppError('Valid base price is required', 400));
    }

    if (!sizes || sizes.length === 0) {
      return next(new AppError('At least one size with price is required', 400));
    }

    if (stockQuantity === undefined || stockQuantity < 0) {
      return next(new AppError('Valid stock quantity is required', 400));
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new AppError('Category not found', 404));
    }

    // Validate sizes format
    for (const size of sizes) {
      if (!['S', 'M', 'L', 'XL'].includes(size.size)) {
        return next(new AppError('Invalid size. Allowed: S, M, L, XL', 400));
      }
      if (!size.price || size.price < 0) {
        return next(new AppError('Each size must have a valid price', 400));
      }
    }

    const product = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      category,
      basePrice,
      sizes,
      isDeal: isDeal || false,
      dealItems: dealItems || [],
      stockQuantity,
      lowStockThreshold: lowStockThreshold || 5,
      image: image ? image.trim() : ''
    });

    // Populate category
    await product.populate('category', 'name description');

    // Create Audit Log
    await createAuditEntry(req, 'create', 'Product', product._id, product.name);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products (Public)
 * @route GET /api/products
 * @access Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, search, sortBy, all } = req.query;
    const filter = {};
    if (all !== 'true') {
      filter.isActive = true;
    }

    // Filter by category if provided
    if (category) {
      filter.category = category;
    }

    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let query = Product.find(filter);

    // Sorting
    if (sortBy === 'price-asc') {
      query = query.sort({ basePrice: 1 });
    } else if (sortBy === 'price-desc') {
      query = query.sort({ basePrice: -1 });
    } else if (sortBy === 'name') {
      query = query.sort({ name: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query;

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID (Public)
 * @route GET /api/products/:id
 * @access Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid product ID', 400));
    }

    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category (Public)
 * @route GET /api/products/category/:categoryId
 * @access Public
 */
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId || categoryId.length !== 24) {
      return next(new AppError('Invalid category ID', 400));
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const products = await Product.find({ category: categoryId, isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        name: category.name,
        description: category.description
      },
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Admin only)
 * @route PUT /api/products/:id
 * @access Private (Admin)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fs = require("fs"); fs.writeFileSync("last_payload.txt", JSON.stringify(req.body)); const { name, description, category, basePrice, sizes, isDeal, dealItems, stockQuantity, lowStockThreshold, image, isActive } = req.body;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid product ID', 400));
    }

    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Update fields
    if (name && name.trim().length > 0) product.name = name.trim();
    if (description !== undefined) product.description = description ? description.trim() : '';

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(new AppError('Category not found', 404));
      }
      product.category = category;
    }

    if (basePrice !== undefined && basePrice >= 0) product.basePrice = basePrice;

    if (sizes && sizes.length > 0) {
      // Validate sizes
      for (const size of sizes) {
        if (!['S', 'M', 'L', 'XL'].includes(size.size)) {
          return next(new AppError('Invalid size. Allowed: S, M, L, XL', 400));
        }
        if (!size.price || size.price < 0) {
          return next(new AppError('Each size must have a valid price', 400));
        }
      }
      product.sizes = sizes;
    }

    if (isDeal !== undefined) product.isDeal = isDeal;
    if (dealItems !== undefined) product.dealItems = dealItems || [];

    // Update stock quantity and log transaction if changed
    if (stockQuantity !== undefined && Number(stockQuantity) >= 0) {
      const newStock = Number(stockQuantity);
      if (product.stockQuantity !== newStock) {
        const diff = newStock - product.stockQuantity;
        const previousStock = product.stockQuantity;
        product.stockQuantity = newStock;

        // Log manual stock modification to InventoryLog
        const InventoryLog = require('../models/InventoryLog');
        await InventoryLog.create({
          product: product._id,
          changeType: diff > 0 ? 'increase' : 'decrease',
          quantity: Math.abs(diff),
          reason: 'manual',
          performedBy: req.user ? req.user.id : null,
          previousStock,
          newStock,
          notes: 'Updated directly from Edit Product screen'
        });
      }
    }

    if (lowStockThreshold !== undefined && lowStockThreshold >= 0) product.lowStockThreshold = lowStockThreshold;
    if (image !== undefined) product.image = image ? image.trim() : '';
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    await product.populate('category', 'name description');

    // Create Audit Log
    await createAuditEntry(req, 'update', 'Product', product._id, product.name);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product stock (Admin only)
 * @route PATCH /api/products/:id/stock
 * @access Private (Admin)
 */
exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, action, notes } = req.body;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid product ID', 400));
    }

    if (!quantity || quantity <= 0) {
      return next(new AppError('Valid quantity is required', 400));
    }

    if (!action || !['increase', 'reduce'].includes(action)) {
      return next(new AppError('Action must be either "increase" or "reduce"', 400));
    }

    let product;
    try {
      if (action === 'reduce') {
        product = await inventoryService.reduceStock(id, quantity, {
          performedBy: req.user.id,
          reason: 'manual',
          notes: notes || 'Direct stock reduction via product stock update endpoint'
        });
      } else {
        product = await inventoryService.increaseStock(id, quantity, {
          performedBy: req.user.id,
          reason: 'manual',
          notes: notes || 'Direct stock increase via product stock update endpoint'
        });
      }
    } catch (error) {
      return next(error);
    }

    await product.populate('category', 'name description');

    res.status(200).json({
      success: true,
      message: `Stock ${action === 'reduce' ? 'reduced' : 'increased'} successfully`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Soft delete - set isActive to false)
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid product ID', 400));
    }

    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    product.isActive = false;
    await product.save();

    // Create Audit Log
    await createAuditEntry(req, 'delete', 'Product', product._id, product.name);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products (Admin only)
 * @route GET /api/products/stock/low
 * @access Private (Admin)
 */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockProducts = await inventoryService.checkLowStock();

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory status (Admin only)
 * @route GET /api/products/stock/status
 * @access Private (Admin)
 */
exports.getInventoryStatus = async (req, res, next) => {
  try {
    const status = await inventoryService.getInventoryStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};
