const mongoose = require('mongoose');

const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;

/**
 * Refund Model
 * Tracks refund requests for delivered or cancelled orders
 * - Only for verified payments (not COD)
 * - One refund per order (unique constraint)
 * - Admin approval and processing workflow
 */
const refundSchema = new Schema(
  {
    // Order Reference (unique - only one refund per order)
    order: {
      type: ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      unique: true,
      sparse: true,
    },

    // Payment Reference
    payment: {
      type: ObjectId,
      ref: 'Payment',
      required: [true, 'Payment ID is required'],
    },

    // Customer who requested the refund
    user: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Refund Amount
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Amount must be at least 0'],
    },

    // Reason for refund
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      minlength: [10, 'Reason must be at least 10 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      trim: true,
    },

    // Refund Status
    status: {
      type: String,
      enum: {
        values: ['Requested', 'Approved', 'Rejected', 'Processed'],
        message:
          'Status must be Requested, Approved, Rejected, or Processed',
      },
      default: 'Requested',
    },

    // Admin Notes (for rejection reason or processing notes)
    adminNote: {
      type: String,
      default: null,
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
      trim: true,
    },

    // Admin who processed the refund
    processedBy: {
      type: ObjectId,
      ref: 'User',
      default: null,
    },

    // When refund was processed
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries — note: { order: 1 } is already indexed via unique:true on the field
refundSchema.index({ payment: 1 });
refundSchema.index({ user: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });

// Pre-find hooks to populate references
refundSchema.pre('find', function () {
  if (!this.getOptions().lean) {
    this.populate('order', 'orderStatus grandTotal paymentMethod')
      .populate('payment', 'amount status paymentMethod')
      .populate('user', 'name email phone')
      .populate('processedBy', 'name email');
  }
});

refundSchema.pre('findById', function () {
  if (!this.getOptions().lean) {
    this.populate('order', 'orderStatus grandTotal paymentMethod')
      .populate('payment', 'amount status paymentMethod')
      .populate('user', 'name email phone')
      .populate('processedBy', 'name email');
  }
});

module.exports = mongoose.model('Refund', refundSchema);
