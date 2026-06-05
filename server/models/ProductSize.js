const mongoose = require('mongoose');

const productSizeSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    size: {
      type: String,
      enum: {
        values: ['S', 'M', 'L', 'XL'],
        message: '{VALUE} is not a valid size',
      },
      required: [true, 'Size is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique constraint: one entry per product-size combination
productSizeSchema.index({ product: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('ProductSize', productSizeSchema);
