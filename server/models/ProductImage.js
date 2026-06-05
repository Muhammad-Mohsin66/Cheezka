const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for finding primary and active images
productImageSchema.index({ product: 1, isPrimary: 1 });
productImageSchema.index({ product: 1, isActive: 1 });

module.exports = mongoose.model('ProductImage', productImageSchema);
