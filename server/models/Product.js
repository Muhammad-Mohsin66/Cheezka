const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: {
        values: ['S', 'M', 'L', 'XL'],
        message: 'Size must be one of: S, M, L, XL'
      },
      required: [true, 'Size is required for variant pricing']
    },
    price: {
      type: Number,
      required: [true, 'Price is required for each size'],
      min: [0, 'Price cannot be negative']
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      minlength: [2, 'Product name must be at least 2 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    sizes: {
      type: [sizeSchema],
      validate: {
        validator: function (sizes) {
          return sizes && sizes.length > 0;
        },
        message: 'At least one size must be provided'
      }
    },
    isDeal: {
      type: Boolean,
      default: false
    },
    dealItems: [
      {
        type: String,
        trim: true
      }
    ],
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Threshold cannot be negative'],
      default: 5
    },
    isOutOfStock: {
      type: Boolean,
      default: false
    },
    image: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Pre-save middleware to update isOutOfStock based on stockQuantity
productSchema.pre('save', function () {
  if (this.stockQuantity <= 0) {
    this.isOutOfStock = true;
  } else {
    this.isOutOfStock = false;
  }
});

// Middleware to populate category on query
productSchema.pre('find', function () {
  this.populate('category', 'name description');
});

productSchema.pre('findOne', function () {
  this.populate('category', 'name description');
});

productSchema.pre('findOneAndUpdate', function () {
  this.populate('category', 'name description');
});

module.exports = mongoose.model('Product', productSchema);
