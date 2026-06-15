const mongoose = require('mongoose');

const orderStatusLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      index: true,
    },
    previousStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Preparing',
        'Ready',
        'Assigned to Rider',
        'Handover to Rider',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Refund Requested',
        'Refunded',
      ],
    },
    newStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Preparing',
        'Ready',
        'Assigned to Rider',
        'Handover to Rider',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Refund Requested',
        'Refunded',
      ],
      required: [true, 'New status is required'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'changedByModel',
      required: [true, 'User who changed status is required'],
    },
    changedByModel: {
      type: String,
      required: true,
      enum: ['User', 'Customer', 'Employee', 'Rider'],
      default: 'User',
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for tracking order status history
orderStatusLogSchema.index({ order: 1, createdAt: -1 });
orderStatusLogSchema.index({ changedBy: 1 });

module.exports = mongoose.model('OrderStatusLog', orderStatusLogSchema);
