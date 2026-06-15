const mongoose = require('mongoose');

const refundLogSchema = new mongoose.Schema(
  {
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      required: [true, 'Refund is required'],
      index: true,
    },
    action: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'processed', 'failed'],
      required: [true, 'Action is required'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'performedByModel',
      required: [true, 'User is required'],
    },
    performedByModel: {
      type: String,
      required: true,
      enum: ['User', 'Customer', 'Employee', 'Rider'],
      default: 'User',
    },
    note: {
      type: String,
      trim: true,
    },
    previousStatus: {
      type: String,
      trim: true,
    },
    newStatus: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index for tracking refund action history
refundLogSchema.index({ refund: 1, createdAt: -1 });
refundLogSchema.index({ performedBy: 1 });
refundLogSchema.index({ action: 1 });

module.exports = mongoose.model('RefundLog', refundLogSchema);
