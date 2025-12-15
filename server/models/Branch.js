const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      minlength: [3, 'Branch name must be at least 3 characters']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?1?\d{9,15}$/, 'Please provide a valid phone number']
    },
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    totalTables: {
      type: Number,
      default: 0,
      min: [0, 'Total tables cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    operatingHours: {
      openingTime: String,
      closingTime: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ manager: 1 });

module.exports = mongoose.model('Branch', branchSchema);
