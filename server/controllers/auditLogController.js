const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * GET /api/audit-logs
 * List audit logs with filters (admin only)
 * Query: ?action=&collection=&userId=&page=&limit=&startDate=&endDate=
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, collection, userId, page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (collection) filter.targetCollection = collection;
    if (userId) filter.user = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit-logs/stats
 * Action count summary for the dashboard
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentActivity = await AuditLog.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: { stats, recentActivity } });
  } catch (error) {
    next(error);
  }
};

/**
 * Utility: Write an audit log entry. Call from other controllers.
 * Usage: await createAuditEntry(req, 'create', 'Product', product._id, product.name)
 */
exports.createAuditEntry = async (req, targetAction, targetCollection, targetId = null, targetName = '', changes = {}) => {
  try {
    if (!req.user?.id) return;
    await AuditLog.create({
      user: req.user.id,
      action: targetAction,
      targetCollection,
      targetId,
      targetName,
      changes,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      status: 'success',
    });
  } catch {
    // Audit logging failure should not break main operation
  }
};
