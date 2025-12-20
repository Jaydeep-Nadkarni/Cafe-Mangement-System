const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    timeRange: {
      type: String,
      enum: ['15min', '1h', '6h', 'today', '7d', '30d'],
      default: '7d'
    },
    aiInsights: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    geminiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    sections: {
      executiveSummary: String,
      performanceAnalysis: String,
      efficiencyInsights: String,
      riskAssessment: String,
      couponStrategy: String,
      forecastAnalysis: String,
      anomalyExplanation: String,
      customerBehavior: String,
      operationalRecommendations: String,
      actionPlan: String
    },
    metadata: {
      apiCallDuration: Number,
      tokensUsed: Number,
      model: String,
      promptLength: Number
    },
    expiresAt: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

// Index for efficient cache lookups
aiCacheSchema.index({ branch: 1, date: 1, timeRange: 1 }, { unique: true });
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to check if cache is still valid (within 24 hours)
aiCacheSchema.methods.isValid = function() {
  const now = new Date();
  const cacheAge = now - this.createdAt;
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return cacheAge < oneDayInMs;
};

// Static method to find valid cache
aiCacheSchema.statics.findValidCache = async function(branchId, timeRange = '7d') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const cache = await this.findOne({
    branch: branchId,
    timeRange,
    date: today,
    expiresAt: { $gt: new Date() }
  });
  
  return cache;
};

// Stats Cache Schema for Incremental Aggregation
const statsCacheSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    timeRange: {
      type: String,
      enum: ['today', '7d', '30d'],
      default: 'today'
    },
    // Cached aggregate data
    aggregates: {
      totalRevenue: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      avgOrderValue: { type: Number, default: 0 },
      totalItemsSold: { type: Number, default: 0 },
      paymentBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
      categoryBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
      hourlyPattern: [{ hour: Number, orders: Number, revenue: Number }],
      topItems: [{ itemId: mongoose.Schema.Types.ObjectId, name: String, quantity: Number, revenue: Number }]
    },
    // Real-time delta (changes since last cache)
    delta: {
      revenue: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      items: { type: Number, default: 0 }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

statsCacheSchema.index({ branch: 1, date: 1, timeRange: 1 }, { unique: true });
statsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Apply incremental delta to cached aggregates
statsCacheSchema.methods.applyDelta = function(deltaData) {
  this.aggregates.totalRevenue += deltaData.revenue || 0;
  this.aggregates.totalOrders += deltaData.orders || 0;
  this.aggregates.totalItemsSold += deltaData.items || 0;
  if (this.aggregates.totalOrders > 0) {
    this.aggregates.avgOrderValue = this.aggregates.totalRevenue / this.aggregates.totalOrders;
  }
  this.delta.revenue += deltaData.revenue || 0;
  this.delta.orders += deltaData.orders || 0;
  this.delta.items += deltaData.items || 0;
  this.lastUpdated = new Date();
};

const StatsCache = mongoose.model('StatsCache', statsCacheSchema);

// Static method to create or update cache
aiCacheSchema.statics.createOrUpdate = async function(branchId, timeRange, aiInsights, geminiResponse, sections, metadata) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiresAt = new Date(today);
  expiresAt.setDate(expiresAt.getDate() + 1); // Expire after 24 hours
  
  const cacheData = {
    branch: branchId,
    date: today,
    timeRange,
    aiInsights,
    geminiResponse,
    sections,
    metadata,
    expiresAt
  };
  
  const cache = await this.findOneAndUpdate(
    { branch: branchId, date: today, timeRange },
    cacheData,
    { upsert: true, new: true }
  );
  
  return cache;
};

module.exports = {
  AICache: mongoose.model('AICache', aiCacheSchema),
  StatsCache
};
