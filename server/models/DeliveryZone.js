const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Zone name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    baseCharge: {
      type: Number,
      required: [true, 'Base charge is required'],
      min: [0, 'Base charge cannot be negative'],
    },
    perKmRate: {
      type: Number,
      required: [true, 'Per km rate is required'],
      min: [0, 'Per km rate cannot be negative'],
    },
    estimatedTime: {
      type: Number, // in minutes
      required: [true, 'Estimated time is required'],
      min: [1, 'Estimated time must be at least 1 minute'],
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    radius: {
      type: Number, // in km
      required: [true, 'Zone radius is required'],
      min: [0.1, 'Radius must be at least 0.1 km'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
deliveryZoneSchema.index({ coordinates: '2dsphere' });
deliveryZoneSchema.index({ name: 1 });
deliveryZoneSchema.index({ isActive: 1 });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
