const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    productSize: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductSize',
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    size: {
      type: String,
      enum: {
        values: ['S', 'M', 'L', 'XL'],
        message: '{VALUE} is not a valid size',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for finding items by order
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
