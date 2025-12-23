const mongoose = require('mongoose');

const customerPreferencesSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits']
    },
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
      }
    ],
    // Communication Preferences
    preferences: {
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false }
    },
    // Subscription Types
    subscriptions: {
      offers: { type: Boolean, default: false },
      announcements: { type: Boolean, default: false },
      events: { type: Boolean, default: false },
      menuUpdates: { type: Boolean, default: false }
    },
    // Customer Info
    name: String,
    email: String,
    isFavorite: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    // Engagement Stats
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      lastOrderDate: Date,
      lastBroadcastReceived: Date,
      broadcastsReceived: { type: Number, default: 0 },
      broadcastsOpened: { type: Number, default: 0 },
      broadcastsClicked: { type: Number, default: 0 }
    },
    // Opt-out tracking
    optedOut: {
      type: Boolean,
      default: false,
      index: true
    },
    optedOutAt: Date,
    optedOutChannels: [String], // Specific channels opted out from
    optedOutReasons: [String],
    // Last sync from orders
    lastSyncedAt: Date,
    source: {
      type: String,
      enum: ['order', 'manual', 'import'],
      default: 'order'
    }
  },
  { timestamps: true }
);

// Indexes for performance
customerPreferencesSchema.index({ phone: 1 });
customerPreferencesSchema.index({ optedOut: 1 });
customerPreferencesSchema.index({ branches: 1 });
customerPreferencesSchema.index({ 'preferences.whatsapp': 1 });
customerPreferencesSchema.index({ 'stats.lastOrderDate': -1 });

module.exports = mongoose.model('CustomerPreferences', customerPreferencesSchema);
