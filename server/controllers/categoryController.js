const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

/**
 * Create a new category (Admin only)
 * @route POST /api/categories
 * @access Private (Admin)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return next(new AppError('Category name is required', 400));
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return next(new AppError('Category with this name already exists', 400));
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Category name must be unique', 400));
    }
    next(error);
  }
};

/**
 * Get all categories (Public)
 * @route GET /api/categories
 * @access Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by ID (Public)
 * @route GET /api/categories/:id
 * @access Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid category ID', 400));
    }

    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category (Admin only)
 * @route PUT /api/categories/:id
 * @access Private (Admin)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid category ID', 400));
    }

    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Update fields
    if (name && name.trim().length > 0) {
      // Check for duplicate name (excluding current category)
      const duplicate = await Category.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });
      if (duplicate) {
        return next(new AppError('Category name must be unique', 400));
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : '';
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Category name must be unique', 400));
    }
    next(error);
  }
};

/**
 * Delete category (Soft delete - set isActive to false)
 * @route DELETE /api/categories/:id
 * @access Private (Admin)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return next(new AppError('Invalid category ID', 400));
    }

    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Check if category has associated products
    const productsCount = await Product.countDocuments({ category: id, isActive: true });
    if (productsCount > 0) {
      return next(
        new AppError(
          `Cannot delete category. It has ${productsCount} active products. Please move or delete products first.`,
          400
        )
      );
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
