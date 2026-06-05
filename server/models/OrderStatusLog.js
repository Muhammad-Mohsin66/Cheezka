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
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
    },
    newStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Preparing',
        'Ready',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      required: [true, 'New status is required'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who changed status is required'],
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
