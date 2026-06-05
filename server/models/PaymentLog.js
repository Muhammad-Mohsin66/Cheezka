const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment is required'],
      index: true,
    },
    action: {
      type: String,
      enum: ['uploaded', 'verified', 'rejected', 'refunded', 'disputed'],
      required: [true, 'Action is required'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index for tracking payment action history
paymentLogSchema.index({ payment: 1, createdAt: -1 });
paymentLogSchema.index({ performedBy: 1 });
paymentLogSchema.index({ action: 1 });

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
