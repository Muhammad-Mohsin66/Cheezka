const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;

/**
 * Payment Model
 * Tracks manual payment verification for orders
 * - Stores payment screenshots
 * - Tracks verification status
 * - Links to orders and users
 */
const paymentSchema = new Schema(
  {
    // Order Reference
    order: {
      type: ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
    },

    // User who made the payment
    user: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Payment Method (should match order paymentMethod)
    paymentMethod: {
      type: String,
      enum: ['Online', 'Bank Transfer', 'JazzCash', 'EasyPaisa'],
      required: [true, 'Payment method is required'],
    },

    // Screenshot/Proof of Payment
    screenshot: {
      type: String,
      required: [true, 'Payment screenshot is required'],
      // File path: /uploads/payments/filename
    },

    // Amount to be verified
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be at least 0'],
    },

    // Verification Status
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Verified', 'Rejected'],
        message: 'Status must be Pending, Verified, or Rejected',
      },
      default: 'Pending',
    },

    // Admin Notes (for rejection reason or verification notes)
    adminNote: {
      type: String,
      default: null,
    },

    // Admin who verified the payment
    verifiedBy: {
      type: ObjectId,
      ref: 'User',
      default: null,
    },

    // When payment was verified
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-find hooks to populate references
paymentSchema.pre('find', function () {
  this.populate('order', 'orderStatus grandTotal paymentMethod');
  this.populate('user', 'name email phone');
  this.populate('verifiedBy', 'name email');
});

paymentSchema.pre('findById', function () {
  this.populate('order', 'orderStatus grandTotal paymentMethod');
  this.populate('user', 'name email phone');
  this.populate('verifiedBy', 'name email');
});

module.exports = mongoose.model('Payment', paymentSchema);
