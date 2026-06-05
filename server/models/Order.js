const mongoose = require('mongoose');

// OrderItem Schema (Embedded)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for order item'],
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
      message: '{VALUE} is not a valid size. Choose from S, M, L, XL',
    },
    required: [true, 'Size is required'],
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
});

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    // Customer Info
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },

    // Order Items
    orderItems: {
      type: [orderItemSchema],
      required: [true, 'Order must have at least one item'],
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },

    // Shipping Details
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
      minlength: [5, 'Shipping address must be at least 5 characters'],
      maxlength: [500, 'Shipping address cannot exceed 500 characters'],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Phone number must be a valid 10-digit number'],
    },

    // Amount Details
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative'],
    },

    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative'],
    },

    // Payment Info
    paymentMethod: {
      type: String,
      enum: {
        values: ['COD', 'Online'],
        message: '{VALUE} is not a valid payment method. Choose COD or Online',
      },
      required: [true, 'Payment method is required'],
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Verified', 'Failed'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Pending',
    },

    // Order Status
    orderStatus: {
      type: String,
      enum: {
        values: [
          'Pending',
          'Confirmed',
          'Preparing',
          'Ready',
          'Assigned to Rider',
          'Handover to Rider',
          'Delivered',
          'Cancelled',
          'Refund Requested',
          'Refunded',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'Pending',
    },

    // Rider Assignment
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Tracking
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ rider: 1 });

// Auto-populate customer and rider on queries
orderSchema.pre('find', function () {
  this.populate('customer', 'name email phone');
  this.populate('rider', 'name email phone');
  this.populate('orderItems.product', 'name basePrice');
});

orderSchema.pre('findById', function () {
  this.populate('customer', 'name email phone');
  this.populate('rider', 'name email phone');
  this.populate('orderItems.product', 'name basePrice');
});

module.exports = mongoose.model('Order', orderSchema);
