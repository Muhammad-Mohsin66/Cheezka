const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    otpCode: {
      type: String,
      required: [true, 'OTP code is required'],
      length: 6,
      select: false, // Don't return by default for security
    },
    expireAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
      index: { expires: 0 }, // Auto-delete after expiration
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum OTP attempts exceeded'],
    },
    lastAttemptAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for finding active OTPs
otpVerificationSchema.index({ user: 1, verified: 1 });

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
