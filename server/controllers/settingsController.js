const SystemSetting = require('../models/SystemSetting');
const { createAuditEntry } = require('./auditLogController');
const AppError = require('../utils/AppError');

/**
 * GET /api/settings
 * Get all system settings grouped by category (admin only)
 */
exports.getAllSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const settings = await SystemSetting.find(filter).sort({ category: 1, key: 1 });

    // Group by category
    const grouped = settings.reduce((acc, s) => {
      const cat = s.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {});

    res.status(200).json({ success: true, count: settings.length, data: grouped });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings/public
 * Get public settings (no auth required)
 */
exports.getPublicSettings = async (req, res, next) => {
  try {
    const keys = [
      'TAX_PERCENTAGE',
      'MIN_ORDER_VALUE',
      'DELIVERY_BASE_CHARGE',
      'MAINTENANCE_MODE'
    ];
    
    const settings = await SystemSetting.find({ key: { $in: keys } });
    
    // Map to simple key-value object
    const publicSettings = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    
    // Provide defaults if not found
    if (publicSettings.TAX_PERCENTAGE === undefined) publicSettings.TAX_PERCENTAGE = 0;
    if (publicSettings.MIN_ORDER_VALUE === undefined) publicSettings.MIN_ORDER_VALUE = 0;
    
    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings/:key
 * Update a specific setting by key (admin only)
 */
exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return next(new AppError('Value is required', 400));
    }

    let setting = await SystemSetting.findOne({ key: key.toUpperCase() });

    if (!setting) {
      return next(new AppError(`Setting "${key}" not found`, 404));
    }

    if (!setting.isEditable) {
      return next(new AppError(`Setting "${key}" is read-only`, 403));
    }

    setting.value = value;
    setting.lastUpdatedBy = req.user.id;
    await setting.save();

    await createAuditEntry(req, 'update', 'Setting', setting._id, setting.key);

    res.status(200).json({ success: true, message: 'Setting updated successfully', data: setting });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/settings
 * Create a new setting (superadmin use-case)
 */
exports.createSetting = async (req, res, next) => {
  try {
    const { key, value, type, description, category, isEditable } = req.body;

    if (!key || value === undefined) {
      return next(new AppError('Key and value are required', 400));
    }

    const existing = await SystemSetting.findOne({ key: key.toUpperCase() });
    if (existing) {
      return next(new AppError(`Setting "${key}" already exists`, 400));
    }

    const setting = await SystemSetting.create({
      key: key.toUpperCase(),
      value,
      type: type || 'string',
      description: description || '',
      category: category || 'general',
      isEditable: isEditable !== undefined ? isEditable : true,
      lastUpdatedBy: req.user.id,
    });

    await createAuditEntry(req, 'create', 'Setting', setting._id, setting.key);

    res.status(201).json({ success: true, message: 'Setting created successfully', data: setting });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/settings/:key
 * Delete a setting (admin only)
 */
exports.deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await SystemSetting.findOne({ key: key.toUpperCase() });
    if (!setting) return next(new AppError(`Setting "${key}" not found`, 404));

    await setting.deleteOne();

    await createAuditEntry(req, 'delete', 'Setting', setting._id, setting.key);

    res.status(200).json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    next(error);
  }
};
