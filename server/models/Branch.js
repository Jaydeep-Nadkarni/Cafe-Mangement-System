const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      minlength: [3, 'Branch name must be at least 3 characters']
    },
    branchCode: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true,
      uppercase: true,
      trim: true
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
      match: [/^\+?1?\d{9,15}$/, 'Please provide a valid phone number'],
      sparse: true
    },
    mobileNumber: {
      type: String,
      match: [/^\+?1?\d{9,15}$/, 'Please provide a valid mobile number'],
      sparse: true
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
    },
    // GST and Profile fields
    gstNumber: {
      type: String,
      trim: true,
      sparse: true
    },
    cgstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    sgstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fullAddress: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ manager: 1 });

module.exports = mongoose.model('Branch', branchSchema);
