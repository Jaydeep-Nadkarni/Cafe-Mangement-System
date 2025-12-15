const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Code must be at least 3 characters']
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative']
    },
    maxDiscountAmount: {
      type: Number,
      default: null
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usagePerUser: {
      type: Number,
      default: 1
    },
    usageCount: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required']
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    applicableCategories: {
      type: [String],
      default: []
    },
    applicableBranches: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Branch',
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
