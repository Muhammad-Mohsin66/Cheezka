const mongoose = require('mongoose');

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true, // One assignment per order
      index: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider is required'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigner is required'],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'assigned',
    },
    deliveryZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryZone',
    },
    actualDistance: {
      type: Number, // in km
    },
    actualDeliveryTime: {
      type: Number, // in minutes
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for finding assignments by rider
deliveryAssignmentSchema.index({ rider: 1, status: 1 });
deliveryAssignmentSchema.index({ order: 1 });
deliveryAssignmentSchema.index({ assignedAt: -1 });

module.exports = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
