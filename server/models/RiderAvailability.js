const mongoose = require('mongoose');

const riderAvailabilitySchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider is required'],
      unique: true,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 5,
    },
    ongoingDeliveries: {
      type: Number,
      default: 0,
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Geospatial index for location queries
riderAvailabilitySchema.index({ currentLocation: '2dsphere' });
riderAvailabilitySchema.index({ rider: 1 });
riderAvailabilitySchema.index({ isAvailable: 1 });

module.exports = mongoose.model('RiderAvailability', riderAvailabilitySchema);
