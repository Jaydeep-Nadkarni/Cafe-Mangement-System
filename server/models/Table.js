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
      default: 'indoor'
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance', 'paid', 'printed'],
      default: 'available'
    },
    reservation: {
      isReserved: { type: Boolean, default: false },
      reservedBy: { type: String, default: '' },
      reservedPhone: { type: String, default: '' },
      reservationTime: { type: Date, default: null },
      reservationNotes: { type: String, default: '' }
    },
    currentOrders: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      }],
      default: []
    },
    qrCode: {
      type: String,
      default: null
    },
    // Session Tracking
    sessionStart: {
      type: Date,
      default: null
    },
    sessionStats: {
      totalOrders: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      unpaidAmount: { type: Number, default: 0 }
    },
    notes: {
      type: String,
      default: ''
    },
    currentOccupancy: {
      type: Number,
      default: 0
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
