const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting value is required'],
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      default: 'string',
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'general',
        'payment',
        'delivery',
        'notification',
        'security',
        'email',
      ],
      default: 'general',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Examples of system settings:
// DELIVERY_BASE_CHARGE, MAX_ORDER_VALUE, MIN_ORDER_VALUE
// EMAIL_VERIFICATION_ENABLED, OTP_EXPIRY_TIME, etc.

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
