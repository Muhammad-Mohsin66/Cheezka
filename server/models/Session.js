const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      select: false,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
      browser: String,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // Auto-delete expired sessions
    },
  },
  { timestamps: true }
);

// Index for session lookup
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ token: 1 });

module.exports = mongoose.model('Session', sessionSchema);
