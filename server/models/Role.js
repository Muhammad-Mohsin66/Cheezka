const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['admin', 'employee', 'rider', 'customer'],
      unique: true,
      required: [true, 'Role name is required'],
      lowercase: true,
    },
    permissions: [
      {
        type: String,
        description: 'Permission identifier (e.g., create_order, view_reports)',
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookup
roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);
