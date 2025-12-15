const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Table number is required'],
      min: [1, 'Table number must be at least 1']
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [20, 'Capacity cannot exceed 20']
    },
    location: {
      type: String,
      enum: ['indoor', 'outdoor', 'counter'],
      default: 'indoor'
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available'
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    qrCode: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound index for branch and table number
tableSchema.index({ branch: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ branch: 1, status: 1 });

module.exports = mongoose.model('Table', tableSchema);
