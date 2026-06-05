const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    action: {
      type: String,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'approve',
        'reject',
        'assign',
        'login',
        'logout',
      ],
      required: [true, 'Action is required'],
    },
    targetCollection: {
      type: String,
      enum: [
        'Product',
        'Order',
        'Payment',
        'Refund',
        'User',
        'Role',
        'Deal',
        'Category',
        'Report',
        'Notification',
      ],
      required: [true, 'Target collection is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetName: {
      type: String,
      trim: true,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for audit queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ targetCollection: 1, action: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
