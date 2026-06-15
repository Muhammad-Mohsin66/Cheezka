const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient (User receiving notification)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },

    // Notification Content
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    // Notification Type
    type: {
      type: String,
      enum: {
        values: ['order', 'payment', 'refund', 'system', 'promotion', 'alert', 'reminder'],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Type is required'],
      index: true,
    },

    // Related Document Reference (Order, Payment, or Refund ID)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Read Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Metadata
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Pre-find hook to populate recipient
notificationSchema.pre(/^find/, function () {
  if (this.options.autoPopulate !== false) {
    this.populate({
      path: 'recipient',
      select: 'name email phone',
    });
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
