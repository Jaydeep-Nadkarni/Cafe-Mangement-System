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
          required: true
        },
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
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'merged'],
      default: 'pending',
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

// Analytics optimization indexes
orderSchema.index({ branch: 1, createdAt: -1, status: 1 }); // Revenue pattern queries
orderSchema.index({ branch: 1, createdAt: -1, paymentMethod: 1 }); // Payment breakdown
orderSchema.index({ branch: 1, createdAt: -1, paymentStatus: 1, total: 1 }); // Revenue calculations
orderSchema.index({ table: 1, createdAt: -1, status: 1 }); // Table occupancy
orderSchema.index({ 'items.menuItem': 1, createdAt: -1 }); // Menu velocity
orderSchema.index({ branch: 1, completedAt: -1 }); // Completed orders analysis
orderSchema.index({ branch: 1, paidAt: -1 }); // Payment timing analysis

module.exports = mongoose.model('Order', orderSchema);
