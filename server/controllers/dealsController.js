const Deal = require('../models/Deal');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('./auditLogController');

/**
 * GET /api/deals
 * List all deals with optional filters ?active=true&search=
 */
exports.getAllDeals = async (req, res, next) => {
  try {
    const { active, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('products', 'name basePrice image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Deal.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: deals.length,
      total,
      data: deals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deals/:id
 */
exports.getDealById = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id).populate('products', 'name basePrice image');
    if (!deal) return next(new AppError('Deal not found', 404));

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/deals
 * Create a deal (admin only)
 */
exports.createDeal = async (req, res, next) => {
  try {
    const { title, description, products, dealPrice, originalPrice, discount, startDate, endDate, maxUses } = req.body;

    if (!title || !dealPrice || !startDate || !endDate) {
      return next(new AppError('Title, deal price, start date, and end date are required', 400));
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate products if provided
    if (products && products.length > 0) {
      for (const pid of products) {
        const product = await Product.findById(pid);
        if (!product) return next(new AppError(`Product with ID ${pid} not found`, 404));
      }
    }

    const deal = await Deal.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      products: products || [],
      dealPrice,
      originalPrice: originalPrice || null,
      discount: discount || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxUses: maxUses || null,
    });

    await deal.populate('products', 'name basePrice image');

    // Create Audit Log
    await createAuditEntry(req, 'create', 'Deal', deal._id, deal.title);

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/deals/:id
 * Update a deal (admin only)
 */
exports.updateDeal = async (req, res, next) => {
  try {
    const { title, description, products, dealPrice, originalPrice, discount, startDate, endDate, isActive, maxUses } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) return next(new AppError('Deal not found', 404));

    if (title) deal.title = title.trim();
    if (description !== undefined) deal.description = description ? description.trim() : '';
    if (dealPrice !== undefined) deal.dealPrice = dealPrice;
    if (originalPrice !== undefined) deal.originalPrice = originalPrice;
    if (discount !== undefined) deal.discount = discount;
    if (startDate) deal.startDate = new Date(startDate);
    if (endDate) deal.endDate = new Date(endDate);
    if (isActive !== undefined) deal.isActive = isActive;
    if (maxUses !== undefined) deal.maxUses = maxUses;

    if (products !== undefined) {
      for (const pid of products) {
        const product = await Product.findById(pid);
        if (!product) return next(new AppError(`Product with ID ${pid} not found`, 404));
      }
      deal.products = products;
    }

    await deal.save();
    await deal.populate('products', 'name basePrice image');

    // Create Audit Log
    await createAuditEntry(req, 'update', 'Deal', deal._id, deal.title);

    res.status(200).json({ success: true, message: 'Deal updated successfully', data: deal });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/deals/:id/toggle
 * Toggle deal active status (admin only)
 */
exports.toggleDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return next(new AppError('Deal not found', 404));

    deal.isActive = !deal.isActive;
    await deal.save();

    // Create Audit Log
    await createAuditEntry(req, 'update', 'Deal', deal._id, deal.title);

    res.status(200).json({
      success: true,
      message: `Deal ${deal.isActive ? 'activated' : 'deactivated'} successfully`,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/deals/:id
 * Delete a deal (admin only)
 */
exports.deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return next(new AppError('Deal not found', 404));

    const dealTitle = deal.title;
    const dealId = deal._id;
    await deal.deleteOne();

    // Create Audit Log
    await createAuditEntry(req, 'delete', 'Deal', dealId, dealTitle);

    res.status(200).json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    next(error);
  }
};
