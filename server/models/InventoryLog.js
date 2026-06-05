const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    changeType: {
      type: String,
      enum: ['increase', 'decrease'],
      required: [true, 'Change type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      enum: ['order', 'cancel', 'manual', 'restock', 'damage', 'return'],
      required: [true, 'Reason is required'],
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for tracking inventory changes
inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ reason: 1 });
inventoryLogSchema.index({ performedBy: 1 });
inventoryLogSchema.index({ relatedOrder: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
