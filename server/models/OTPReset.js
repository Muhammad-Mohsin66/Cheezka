const mongoose = require('mongoose');

const otpResetSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    otpSalt: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-expire from MongoDB TTL index
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OTPReset', otpResetSchema);
