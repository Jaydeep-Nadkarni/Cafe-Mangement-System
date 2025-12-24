const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required']
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null
    },
    items: {
      type: [{
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: false
        },
        name: String, // For custom/open items
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: true
        },
        specialInstructions: String,
        status: {
          type: String,
          enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
          default: 'pending'
        }
      }],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length > 0;
        },
        message: 'Order must have at least one item'
      }
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total cannot be negative']
    },
    status: {
      type: String,
      enum: ['created', 'confirmed', 'preparing', 'ready', 'paid', 'closed', 'cancelled'],
      default: 'created',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: [null, 'cash', 'card', 'upi', 'wallet', 'online'],
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    customerName: {
      type: String,
      default: null
    },
    customerPhone: {
      type: String,
      default: null
    },
    taxNumber: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    chefNotes: {
      type: String,
      default: ''
    },
    completedAt: {
      type: Date,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    // Merge metadata for audit trails
    isMerged: {
      type: Boolean,
      default: false,
      index: true
    },
    mergedAt: {
      type: Date,
      default: null
    },
    originalOrderIds: {
      type: [String],
      default: []
    },
    mergeNote: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    isComplementary: {
      type: Boolean,
      default: false
    },
    complementaryAmount: {
      type: Number,
      default: 0
    },
    complementaryReason: {
      type: String,
      default: null
    },
    customerGSTN: {
      type: String,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    roundOff: {
      type: Number,
      default: 0
    },
    cgst: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    cgstRate: {
      type: Number,
      default: 0
    },
    sgstRate: {
      type: Number,
      default: 0
    },
    // Session management for pay-later and pay-now scenarios
    sessionId: {
      type: String,
      index: true,
      default: null,
      comment: 'Groups orders from same table session - null means separate session'
    },
    sessionPerson: {
      type: String,
      default: null,
      comment: 'Person/customer name for this part of the session'
    },
    orderType: {
      type: String,
      enum: ['pay_later', 'pay_now'],
      default: 'pay_later',
      comment: 'pay_later: auto-merge orders; pay_now: check session before merging'
    },
    // Edit history for audit trail
    editHistory: {
      type: [{
        editedAt: Date,
        editedBy: mongoose.Schema.Types.ObjectId,
        editedByName: String,
        editedByRole: String,
        changeType: {
          type: String,
          enum: ['item_added', 'item_removed', 'item_modified', 'price_adjusted', 'discount_applied', 'status_changed', 'note_added'],
          required: true
        },
        fieldChanged: String,
        beforeValue: mongoose.Schema.Types.Mixed,
        afterValue: mongoose.Schema.Types.Mixed,
        reason: String
      }],
      default: []
    },
    // Merge history for tracking order merges
    mergeHistory: {
      type: [{
        mergedAt: Date,
        mergedBy: mongoose.Schema.Types.ObjectId,
        mergedByName: String,
        mergedWithOrderIds: [mongoose.Schema.Types.ObjectId],
        itemCountBefore: Number,
        itemCountAfter: Number,
        amountBefore: Number,
        amountAfter: Number,
        reason: String
      }],
      default: []
    },
    // Manual completion/closure tracking
    manualCompletionLog: {
      completedAt: Date,
      completedBy: mongoose.Schema.Types.ObjectId,
      completedByName: String,
      completedByRole: String,
      reason: String
    }
  },
  { timestamps: true }
);

// Pre-save middleware to generate orderNumber and calculate totals
orderSchema.pre('save', async function(next) {
  try {
    // Generate orderNumber if not provided
    if (!this.orderNumber) {
      let branchCode = 'ORD';
      try {
        const branch = await mongoose.model('Branch').findById(this.branch);
        if (branch) {
          branchCode = branch.branchCode;
        }
      } catch (err) {
        console.error('Could not fetch branch for orderNumber:', err.message);
        // Continue with default branchCode
      }
      
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.orderNumber = `${branchCode}-${timestamp}-${random}`;
      console.log('Generated orderNumber:', this.orderNumber);
    }

    // Validate orderNumber was generated
    if (!this.orderNumber) {
      throw new Error('Order number generation failed');
    }

    // Validate and ensure date fields are proper Date objects
    const dateFields = ['completedAt', 'paidAt', 'mergedAt'];
    dateFields.forEach(field => {
      if (this[field]) {
        const dateObj = new Date(this[field]);
        if (isNaN(dateObj.getTime())) {
          // Invalid date - set to null
          console.warn(`Invalid date for field ${field}:`, this[field]);
          this[field] = null;
        } else {
          // Ensure it's a proper Date object
          this[field] = dateObj;
        }
      }
    });

    // Validate edit history dates
    if (this.editHistory && Array.isArray(this.editHistory)) {
      this.editHistory = this.editHistory.map(edit => {
        if (edit.editedAt) {
          const dateObj = new Date(edit.editedAt);
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid editedAt date:', edit.editedAt);
            edit.editedAt = new Date();
          } else {
            edit.editedAt = dateObj;
          }
        } else {
          edit.editedAt = new Date();
        }
        return edit;
      });
    }

    // Validate merge history dates
    if (this.mergeHistory && Array.isArray(this.mergeHistory)) {
      this.mergeHistory = this.mergeHistory.map(merge => {
        if (merge.mergedAt) {
          const dateObj = new Date(merge.mergedAt);
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid mergedAt date:', merge.mergedAt);
            merge.mergedAt = new Date();
          } else {
            merge.mergedAt = dateObj;
          }
        } else {
          merge.mergedAt = new Date();
        }
        return merge;
      });
    }

    // Calculate totals
    if (this.items && this.items.length > 0) {
      this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      this.tax = this.subtotal * 0.10; // 10% tax
      this.discount = this.discount || 0;
      this.total = this.subtotal + this.tax - this.discount;
    }
    next();
  } catch (error) {
    console.error('Pre-save hook error:', error);
    next(error);
  }
});

// Index for frequently queried fields
orderSchema.index({ branch: 1, status: 1 });
orderSchema.index({ branch: 1, createdAt: -1 });
orderSchema.index({ branch: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ branch: 1, paymentMethod: 1 });
orderSchema.index({ table: 1, status: 1 });
orderSchema.index({ table: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ customerPhone: 1, branch: 1 });
orderSchema.index({ 'editHistory.editedAt': 1 }); // Edit history queries
orderSchema.index({ 'mergeHistory.mergedAt': 1 }); // Merge history queries

// Analytics optimization indexes
orderSchema.index({ branch: 1, createdAt: -1, status: 1 }); // Revenue pattern queries
orderSchema.index({ branch: 1, createdAt: -1, paymentMethod: 1 }); // Payment breakdown
orderSchema.index({ branch: 1, createdAt: -1, paymentStatus: 1, total: 1 }); // Revenue calculations
orderSchema.index({ table: 1, createdAt: -1, status: 1 }); // Table occupancy
orderSchema.index({ 'items.menuItem': 1, createdAt: -1 }); // Menu velocity
orderSchema.index({ branch: 1, completedAt: -1 }); // Completed orders analysis
orderSchema.index({ branch: 1, paidAt: -1 }); // Payment timing analysis

module.exports = mongoose.model('Order', orderSchema);
