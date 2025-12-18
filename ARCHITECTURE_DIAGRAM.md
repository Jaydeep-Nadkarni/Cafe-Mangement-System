# AI Analytics Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  React Components / Dashboard                                        │
│  - AI Analytics Dashboard                                            │
│  - Performance Cards                                                 │
│  - Forecast Charts                                                   │
│  - Recommendation Alerts                                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ HTTP GET Request
                           │ /api/branch/analytics/ai-data?range=7d
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                      API LAYER (Express.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│  branchRoutes.js:                                                    │
│  router.get('/analytics/ai-data', protect, requireBranch,          │
│             branchController.getAIData)                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Middleware: Authentication & Authorization
                           │ - verify JWT token
                           │ - check branch manager role
                           │ - validate branch ownership
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│              CONTROLLER LAYER (branchController.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  getAIData(req, res):                                                │
│  1. Extract manager branch ID                                        │
│  2. Get time range from query params (default: 7d)                  │
│  3. Call analyticsService.getAIInsights()                           │
│  4. Return JSON response                                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Call with parameters:
                           │ - branchId: ObjectId
                           │ - timeRange: '7d' | '30d' | 'today' | etc.
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│         SERVICE LAYER (analyticsService.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  getAIInsights(branchId, timeRange)                                 │
│  ├── Parallel Promise.all execution:                                │
│  ├─── 1. calculatePerformanceScore()                                │
│  ├─── 2. calculateEfficiencyScore()                                 │
│  ├─── 3. calculateRiskScore()                                       │
│  ├─── 4. calculateCouponUplift()                                    │
│  ├─── 5. calculateForecast()                                        │
│  ├─── 6. calculateDeviations()                                      │
│  └─── Generate AI Recommendations                                   │
│                                                                       │
│  Time Range Parser: getTimeRange(range)                             │
│  ├── Converts range string to start/end dates                       │
│  └── Returns: { start: Date, end: Date }                            │
│                                                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │                 │                 │
┌────────▼────┐   ┌────────▼────┐   ┌──────▼────────┐
│  ORDER      │   │  COUPON     │   │  GAME SESSION │
│  QUERIES    │   │  QUERIES    │   │  QUERIES      │
└────────┬────┘   └────────┬────┘   └──────┬────────┘
         │                 │                 │
         │ Aggregation     │ Aggregation     │ Aggregation
         │ Pipeline 1      │ Pipeline 2      │ Pipeline 3
         │                 │                 │
┌────────▼─────────────────▼─────────────────▼────────────┐
│                    MongoDB                               │
├──────────────────────────────────────────────────────────┤
│  Collections:                                             │
│  ├── orders (Indexed: branch, createdAt, status, etc)   │
│  ├── coupons (Indexed: applicableBranches, isActive)    │
│  ├── gamesessions (Indexed: branch, sessionDate, score) │
│  ├── payments (Indexed: branch, status, createdAt)      │
│  └── tables, menuItems, branches                        │
│                                                          │
│  Indexes Enable:                                         │
│  ├── Fast branch filtering                              │
│  ├── Efficient date range queries                       │
│  ├── Quick status/category lookups                      │
│  └── Parallel aggregation execution                     │
└──────────────────────────────────────────────────────────┘
```

## Data Flow - calculatePerformanceScore()

```
Input: branchId, timeRange ('7d')
│
├─ Parse timeRange → { start: Date, end: Date }
│
├─ Query 1: Current Period Orders
│  └─ Order.aggregate([
│     { $match: { branch, status: 'completed'|'paid', createdAt: {$gte:start, $lte:end} } },
│     { $group: { _id: null, revenue, orders } }
│  ]) → { revenue: 250000, orders: 400 }
│
├─ Query 2: Previous Period Orders (for comparison)
│  └─ Order.aggregate([...previous period...])
│     → { revenue: 230000, orders: 380 }
│
├─ Calculation: Revenue Growth Score (40 points max)
│  revenueGrowth = ((250000 - 230000) / 230000) * 100 = 8.7%
│  revenueScore = min(40, max(0, (8.7 + 20) * 2)) = 40
│
├─ Calculation: Completion Rate Score (30 points max)
│  totalOrders = 420, completed = 400
│  completionRate = (400 / 420) * 100 = 95.24%
│  completionScore = (95.24 / 100) * 30 = 28.57
│
├─ Calculation: AOV Score (20 points max)
│  avgOrderValue = 250000 / 400 = 625
│  targetAOV = 500
│  aovScore = min(20, (625 / 500) * 20) = 20
│
├─ Calculation: Retention Score (10 points max)
│  uniqueCustomers = 250 (with phone)
│  returningCustomers = 87 (repeat customers)
│  retentionRate = (87 / 250) * 100 = 34.8%
│  retentionScore = (34.8 / 100) * 10 = 3.48
│
└─ Output:
   {
     score: 40 + 28.57 + 20 + 3.48 = 92,
     breakdown: {
       revenueGrowth: { score: 40, growth: "8.7" },
       completionRate: { score: 28.57, rate: "95.24" },
       avgOrderValue: { score: 20, value: "625" },
       retention: { score: 3.48, rate: "34.8" }
     }
   }
```

## Data Flow - calculateForecast()

```
Input: branchId, timeRange ('7d')
│
├─ Get Daily Data (7 days)
│  Order.aggregate([
│    { $match: { branch, paymentStatus: 'paid' } },
│    { $group: { 
│      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
│      revenue,
│      orders
│    } },
│    { $sort: { _id: 1 } }
│  ])
│
│  Day 1: { revenue: 5000, orders: 12 }
│  Day 2: { revenue: 5200, orders: 13 }
│  Day 3: { revenue: 4800, orders: 11 }
│  Day 4: { revenue: 5300, orders: 13 }
│  Day 5: { revenue: 5500, orders: 14 }
│  Day 6: { revenue: 5400, orders: 13 }
│  Day 7: { revenue: 5600, orders: 14 }
│
├─ Calculate 3-Day Moving Average
│  MA3 = (Day5 + Day6 + Day7) / 3
│       = (5500 + 5400 + 5600) / 3 = 5500
│
├─ Calculate 7-Day Moving Average
│  MA7 = (Day1...Day7) / 7 = 5343
│
├─ Detect Trend
│  Last 3 days avg: (5500 + 5400 + 5600) / 3 = 5500
│  4 days ago: 5300
│  Trend = ((5500 - 5300) / 5300) * 100 = +3.77% → "Upward"
│
├─ Generate 3-Day Forecast
│  Using Last MA7 (5343):
│  Day+1: revenue: 5343, orders: 13, confidence: 90%
│  Day+2: revenue: 5343, orders: 13, confidence: 85%
│  Day+3: revenue: 5343, orders: 13, confidence: 80%
│
└─ Output:
   {
     recentTrend: "+3.77%",
     movingAverages: { ma3Day: 5500, ma7Day: 5343 },
     forecast: [
       { day: 1, predictedRevenue: 5343, predictedOrders: 13, confidence: "90%" },
       { day: 2, predictedRevenue: 5343, predictedOrders: 13, confidence: "85%" },
       { day: 3, predictedRevenue: 5343, predictedOrders: 13, confidence: "80%" }
     ],
     trendDirection: "Upward"
   }
```

## Data Flow - calculateDeviations()

```
Input: branchId, timeRange ('7d')
│
├─ Get Hourly Data
│  Order.aggregate([
│    { $match: { branch, paymentStatus: 'paid' } },
│    { $project: { hour: { $hour: '$createdAt' }, total: 1 } },
│    { $group: { _id: '$hour', revenue: { $avg: '$total' }, count: { $sum: 1 } } },
│    { $sort: { _id: 1 } }
│  ])
│
│  Hour 6:  revenue: 500
│  Hour 7:  revenue: 650
│  Hour 8:  revenue: 750
│  Hour 9:  revenue: 900   ← PEAK
│  Hour 10: revenue: 850
│  Hour 11: revenue: 1200  ← ANOMALY (High)
│  Hour 12: revenue: 2100  ← ANOMALY (Very High)
│  Hour 13: revenue: 950
│  ... (16 hours total)
│
├─ Calculate Baseline Statistics
│  Mean = (all revenues) / count = 1000
│  Variance = sum((revenue - mean)^2) / count
│  StdDev = sqrt(variance) = 320
│
├─ Identify Deviations (> 1.5 * StdDev)
│  Threshold = mean ± (1.5 * stdDev) = 1000 ± 480 = [520, 1480]
│
│  Hour 12: revenue 2100
│  Deviation = (2100 - 1000) / 1000 * 100 = +110%
│  Classification: HIGH ✓ (exceeds upper threshold)
│
│  Hour 6: revenue 500
│  Deviation = (500 - 1000) / 1000 * 100 = -50%
│  Classification: LOW ✓ (below lower threshold)
│
└─ Output:
   {
     baseline: {
       meanRevenue: 1000,
       stdDeviation: 320
     },
     anomalies: [
       { hour: 6, revenue: 500, count: 2, deviation: "-50.00%", type: "Low" },
       { hour: 12, revenue: 2100, count: 8, deviation: "+110.00%", type: "High" }
     ],
     anomalyCount: 2
   }
```

## Response Assembly

```
All 6 functions execute in parallel via Promise.all()
│
├── performanceScore ──┐
├── efficiencyScore ───┤
├── riskScore ─────────┤
├── couponUplift ──────├─→ Combine Results
├── forecast ──────────┤
└── deviations ────────┘

Generated Recommendations Based on:
├── If performance < 60: "Focus on revenue growth"
├── If efficiency < 60: "Optimize operations"
├── If risk > 40: "Address critical risks"
├── If coupon penetration < 15%: "Promote coupons"
└── If trend = "Downward": "Implement recovery"

Final Response:
{
  timeRange: "7d",
  generatedAt: timestamp,
  scores: { performance, efficiency, risk, overallHealth },
  metrics: { couponUplift, forecast, deviations },
  recommendations: [...],
  summary: { bestPerformer, needsAttention }
}
```

## Database Query Performance

```
Index Usage Analysis:

Query 1: Revenue by Period
  db.orders.find({branch, status, createdAt})
  ✓ Uses: branch_1_createdAt_-1_status_1
  ✓ Estimated: 10-50ms

Query 2: Table Utilization
  db.orders.aggregate([{$match: {branch, table, createdAt}}])
  ✓ Uses: table_1_createdAt_-1_status_1
  ✓ Estimated: 15-60ms

Query 3: Coupon Analysis
  db.orders.find({branch, coupon, createdAt})
  ✓ Uses: branch_1_createdAt_-1
  ✓ Estimated: 20-80ms

Query 4: Payment Success Rate
  db.payments.find({branch, status, createdAt})
  ✓ Uses: branch_1_status_1_createdAt_-1
  ✓ Estimated: 10-40ms

Total Parallel Execution Time: ~60-150ms
(All queries run simultaneously, so total time = longest query)

With caching (5-minute TTL): <5ms for cached responses
```

## Scaling Considerations

```
Current Architecture:
├─ Single branch query: ~100-300ms
├─ Concurrent requests: 15+ supported
└─ Data volume: Up to 1M orders per branch

Optimization Points:
├─ Implement Redis cache for 5-min TTL
├─ Create materialized views for static aggregations
├─ Add read replicas for analytics-heavy queries
├─ Batch API requests during peak hours
└─ Archive old data (>90 days) to separate collection

Future Considerations:
├─ Sharding by branch_id if database grows
├─ Time-series database for metrics
├─ Real-time streaming with WebSockets
└─ Separate analytics cluster
```

---

This architecture ensures:
✅ **Performance**: Indexed queries, parallel execution
✅ **Scalability**: Efficient aggregations, optional caching
✅ **Maintainability**: Clear separation of concerns
✅ **Security**: Authentication & authorization at each layer
✅ **Reliability**: Error handling, fallback strategies
