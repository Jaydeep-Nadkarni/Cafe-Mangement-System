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
    couponType: {
      type: String,
      enum: ['simple', 'buy_get', 'quantity_flat', 'category'],
      default: 'simple',
      description: 'Type of coupon rule'
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
    // Buy X Get Y Rules
    buyXGetYRules: {
      enabled: { type: Boolean, default: false },
      itemId: mongoose.Schema.Types.ObjectId,
      itemName: String,
      quantity: { type: Number, min: 1 },
      freeQuantity: { type: Number, min: 1 }
    },
    // Quantity-based flat discount
    quantityRules: {
      enabled: { type: Boolean, default: false },
      minQuantity: { type: Number, min: 1 },
      flatDiscount: { type: Number, min: 0 }
    },
    // Category-based discount
    categoryRules: {
      enabled: { type: Boolean, default: false },
      categoryIds: [mongoose.Schema.Types.ObjectId],
      categoryNames: [String],
      discountPercent: { type: Number, min: 0, max: 100 }
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usagePerDay: {
      type: Number,
      default: null,
      description: 'Maximum usage per calendar day'
    },
    usagePerTable: {
      type: Boolean,
      default: false,
      description: 'Allow only one use per table per day'
    },
    usagePerOrder: {
      type: Boolean,
      default: true,
      description: 'Apply only once per order'
    },
    usagePerUser: {
      type: Number,
      default: 1
    },
    usageCount: {
      type: Number,
      default: 0
    },
    usageByDay: {
      type: Map,
      of: Number,
      default: new Map(),
      description: 'Track usage per day: { YYYY-MM-DD: count }'
    },
    usageByTable: {
      type: Map,
      of: Date,
      default: new Map(),
      description: 'Track last usage per table: { tableId: lastUsedDate }'
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
    },
    previewData: {
      enabled: { type: Boolean, default: true },
      sampleOrder: {
        subtotal: Number,
        items: [{
          itemId: mongoose.Schema.Types.ObjectId,
          quantity: Number,
          price: Number
        }],
        discount: Number,
        finalAmount: Number
      }
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ applicableBranches: 1, isActive: 1, createdAt: -1 }); // Branch-specific active coupons
couponSchema.index({ code: 1, usageCount: 1 }); // Coupon usage analysis
couponSchema.index({ createdAt: -1 }); // Recent coupons
couponSchema.index({ couponType: 1, isActive: 1 }); // Type-based filtering

module.exports = mongoose.model('Coupon', couponSchema);
