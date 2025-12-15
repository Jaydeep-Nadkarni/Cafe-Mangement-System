const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required']
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required']
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'online'],
      required: [true, 'Payment method is required']
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paypal', 'manual'],
      default: 'manual'
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentReference: {
      razorpayPaymentId: String,
      razorpayOrderId: String,
      razorpaySignature: String,
      stripePaymentIntentId: String,
      paypalTransactionId: String
    },
    cardDetails: {
      last4: String,
      cardBrand: String
    },
    upiDetails: {
      upiId: String
    },
    notes: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    completedAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      default: null
    },
    receipt: {
      type: {
        url: String,
        path: String
      },
      default: null
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ branch: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
