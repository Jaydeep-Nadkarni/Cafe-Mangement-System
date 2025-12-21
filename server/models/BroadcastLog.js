const mongoose = require('mongoose');

const broadcastLogSchema = new mongoose.Schema(
  {
    broadcastType: {
      type: String,
      enum: ['offer', 'announcement', 'event', 'menu_launch'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    mediaUrl: {
      type: String,
      default: null,
      description: 'URL to image/media for the broadcast'
    },
    // Target Details
    targetBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
      }
    ],
    targetAudience: {
      type: String,
      enum: ['all_customers', 'opt_in_only', 'vip_customers', 'recent_customers'],
      default: 'opt_in_only'
    },
    // Filter Criteria
    filters: {
      minOrderValue: { type: Number, default: 0 },
      maxOrderValue: { type: Number, default: null },
      lastOrderWithinDays: { type: Number, default: null },
      excludePhones: [String]
    },
    // Channel
    channels: {
      type: [String],
      enum: ['whatsapp', 'sms', 'email'],
      required: true
    },
    // Admin Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    scheduledFor: {
      type: Date,
      default: null,
      description: 'If null, sent immediately'
    },
    // Execution Stats
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 }
    },
    // Status
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
      index: true
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    // Error Tracking
    errors: [
      {
        phone: String,
        error: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    // Opt-out tracking
    optedOutCustomers: [String],
    notes: String
  },
  { timestamps: true }
);

// Indexes for performance
broadcastLogSchema.index({ status: 1, createdAt: -1 });
broadcastLogSchema.index({ broadcastType: 1, status: 1 });
broadcastLogSchema.index({ createdBy: 1, createdAt: -1 });
broadcastLogSchema.index({ 'stats.sent': 1 });

module.exports = mongoose.model('BroadcastLog', broadcastLogSchema);
