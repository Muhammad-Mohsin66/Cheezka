const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema(
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
      select: false, // Don't return by default for security
    },
    type: {
      type: String,
      enum: ['verify', 'reset'],
      required: [true, 'Token type is required'],
    },
    expireAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
      index: { expires: 0 }, // Auto-delete after expiration
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for finding active tokens
emailTokenSchema.index({ user: 1, type: 1, used: 1 });

module.exports = mongoose.model('EmailToken', emailTokenSchema);
