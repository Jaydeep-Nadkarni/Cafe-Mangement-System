# Reports Page - Comprehensive Documentation

## Overview

The Reports page provides historical analytics and business intelligence through 5 comprehensive sections with advanced visualizations.

## Features Implemented ✅

### **1. Five Complete Sections**

#### Section 1: Revenue & Growth
- **Revenue Growth Trend**: Composed chart showing revenue bars + growth % line
- **Seasonality Patterns**: Area chart showing seasonal revenue trends (weekly/monthly)

#### Section 2: Day/Date/Time Patterns
- **Weekday Performance**: Bar chart comparing revenue & orders by weekday
- **Hour-by-Hour Heatmap**: Visx heatmap showing activity intensity by hour

#### Section 3: Menu Intelligence
- **Menu Item Lifecycle**: Scatter plot (Velocity vs Revenue, size = orders)
- **Revenue Distribution**: Treemap showing revenue contribution by menu item

#### Section 4: Risk, Reliability & Health
- **4 Metric Cards**: Payment reliability, failure rate, response time, stress level
- **Order Value Distribution**: Box plot showing order values by payment method

#### Section 5: Executive Summary
- **4 Score Cards**: Performance, Efficiency, Stability, Risk Index (0-100 scores)
- **Key Metrics Summary**: Total revenue, orders, avg order value

### **2. Chart Types Implemented**

| Chart Type | Library | Section | Purpose |
|------------|---------|---------|---------|
| **Composed Chart** | Recharts | Revenue & Growth | Revenue bars + Growth line |
| **Area Chart** | Recharts | Revenue & Growth | Seasonality curve |
| **Bar Chart** | Recharts | Time Patterns | Weekday comparison |
| **Heatmap** | Visx | Time Patterns | Hour-by-hour intensity |
| **Scatter Plot** | Visx | Menu Intelligence | Lifecycle analysis |
| **Treemap** | Visx | Menu Intelligence | Revenue distribution |
| **Box Plot** | Visx | Risk & Health | Value distribution |

### **3. Granularity Toggles**

Three granularity options affect trend charts:
- **Daily**: Hourly data points
- **Weekly**: Daily data points
- **Monthly**: Weekly data points

Toggle buttons at top right switch between granularities.

### **4. Time Range Selector**

Reused from Stats page with 6 preset ranges:
- 15min, 1h, 6h, today, 7d, 30d

All data refetches when range changes.

### **5. REST API Integration**

No Socket.IO - pure REST calls for historical data:

```javascript
GET /api/branch/analytics/revenue-pattern?range=30d&type=hourly
GET /api/branch/analytics/peak-hours?range=30d
GET /api/branch/analytics/table-heatmap?range=30d
GET /api/branch/analytics/item-velocity?range=30d
GET /api/branch/analytics/payment-stats?range=30d
GET /api/branch/analytics/revenue-by-payment?range=30d
GET /api/branch/analytics/realtime?range=30d
```

All fetched in parallel with `Promise.all()`.

### **6. Derived Metrics for Executive Summary**

#### Performance Score (0-100)
```javascript
Performance = (Recent 7-day Revenue / Average Revenue) * 100
```
Measures revenue momentum vs historical average.

#### Efficiency Score (0-100)
```javascript
Efficiency = (Avg Velocity * 10 + Turnaround Score) / 2
Turnaround Score = max(0, 100 - (Avg Turnaround * 2))
```
Combines menu item velocity and order turnaround time.

#### Stability Score (0-100)
```javascript
Stability = Payment Success Rate
```
Direct measure of payment reliability.

#### Risk Index (0-100, lower is better)
```javascript
Risk = Failure Rate + (Turnaround > 30 ? 30 : 0)
```
Combines payment failures and operational delays.

### **7. CSV/PNG Export**

Four export buttons at bottom:
- Revenue Growth (CSV + PNG)
- Seasonality (CSV + PNG)
- Weekday Pattern (CSV + PNG)
- Hourly Heatmap (CSV only)

## Architecture

### Data Processing Functions

**`processRevenueGrowth(pattern)`**
- Calculates period-over-period growth percentage
- Adds `growth` field to each data point

**`processSeasonality(pattern)`**
- Aggregates by day of week or month
- Calculates average revenue per period

**`processWeekdayPattern(pattern)`**
- Groups by weekday (Sun-Sat)
- Calculates average revenue and orders per day

**`processMenuLifecycle(items)`**
- Maps menu items to scatter plot coordinates
- X = velocity, Y = revenue, size = orders

**`processMenuTreemap(items)`**
- Creates hierarchical structure for treemap
- Root node + item nodes with revenue values

**`processOrderDistribution(orders)`**
- Groups orders by payment method
- Creates array of values for box plot

**`calculateRiskMetrics(paymentData, realtimeData)`**
- Computes failure rate, response time
- Determines stress level (Low/Medium/High)
- Calculates reliability score

**`calculateExecutiveSummary(...)`**
- Derives 4 key scores from raw data
- Aggregates total revenue, orders, avg value

### State Management

```javascript
// Chart data
const [revenueGrowth, setRevenueGrowth] = useState([]);
const [seasonalityData, setSeasonalityData] = useState([]);
const [weekdayPattern, setWeekdayPattern] = useState([]);
const [hourlyHeatmap, setHourlyHeatmap] = useState([]);
const [menuLifecycle, setMenuLifecycle] = useState([]);
const [menuTreemap, setMenuTreemap] = useState([]);
const [orderDistribution, setOrderDistribution] = useState([]);

// Metric data
const [paymentReliability, setPaymentReliability] = useState(null);
const [riskMetrics, setRiskMetrics] = useState(null);
const [executiveSummary, setExecutiveSummary] = useState(null);

// UI state
const [loading, setLoading] = useState(true);
const [timeRange, setTimeRange] = useState('30d');
const [granularity, setGranularity] = useState('daily');
```

### Component Hierarchy

```
Reports
├── Section (5 instances)
│   ├── ChartCard (for Recharts)
│   │   └── ResponsiveContainer
│   │       └── BarChart/LineChart/AreaChart
│   ├── ChartContainer (for Visx)
│   │   └── VixsHeatmap/VixsScatter/VixsTreemap/VixsBoxPlot
│   ├── MetricCard (risk metrics)
│   └── ScoreCard (executive scores)
└── ExportButton (4 instances)
```

## Usage

### Navigation
```javascript
// In BranchDashboard
<Reports branch={branch} />
```

### Time Range Selection
Click dropdown at top right, select range (15min to 30d). All charts refetch.

### Granularity Toggle
Three buttons at top right: Daily | Weekly | Monthly
- Daily: Shows hourly data
- Weekly: Shows daily data  
- Monthly: Shows weekly data

### Chart Interactions

**Revenue Growth Trend**
- Hover over bars to see exact revenue
- Hover over line to see growth %
- Dual Y-axes (left = revenue, right = growth)

**Seasonality Patterns**
- Hover to see average revenue per period
- Gradient fill for visual appeal

**Weekday Performance**
- Two bars per day (revenue + orders)
- Hover for exact values

**Hour-by-Hour Heatmap**
- Hover cells to see occupancy %
- Color intensity = activity level

**Menu Item Lifecycle**
- Scatter points sized by order count
- Hover for name, velocity, revenue, orders

**Revenue Distribution**
- Treemap cells sized by revenue
- Hover for item name and revenue

**Order Value Distribution**
- Box shows Q1, median, Q3
- Whiskers show min/max
- Hover for all quartile values

### Score Card Colors

**Performance, Efficiency, Stability** (higher is better):
- Green: ≥70
- Yellow: 40-69
- Red: <40

**Risk Index** (lower is better):
- Green: <40
- Yellow: 40-69
- Red: ≥70

### Export Data
Click any export button to download:
- **CSV**: Raw data table
- **PNG**: Chart screenshot

## Performance Optimizations

1. **Parallel API Calls**: All 7 endpoints fetched simultaneously
2. **Data Memoization**: Processing results cached
3. **Conditional Rendering**: Charts only render when data available
4. **Efficient Updates**: State updates batched
5. **Responsive Charts**: Auto-adjust to container size

## Responsive Design

**Desktop (>1024px)**
- 2 charts per row
- Full chart labels
- Side-by-side layouts

**Tablet (768-1024px)**
- Charts stack responsively
- Abbreviated labels

**Mobile (<768px)**
- Single column
- Charts full width
- KPIs stack vertically

## Error Handling

**No branch data**
- Shows loading spinner with message
- Prevents API calls

**Loading state**
- Shows spinner while fetching
- Message: "Loading reports..."

**Empty data**
- Charts show: "No [type] data available"
- Graceful degradation

**API errors**
- Logged to console
- Empty arrays prevent crashes

## API Response Format

### Revenue Pattern
```json
{
  "pattern": [
    { "label": "10:00", "revenue": 5000, "orders": 20 }
  ]
}
```

### Menu Velocity
```json
{
  "items": [
    { "name": "Latte", "velocity": 2.5, "revenue": 10000, "orders": 100 }
  ]
}
```

### Payment Stats
```json
{
  "successRate": 95.5,
  "failedCount": 10,
  "totalCount": 200
}
```

### Realtime Data
```json
{
  "avgOrderValue": 450,
  "avgTurnaroundTime": 18,
  "recentOrders": [...]
}
```

## Troubleshooting

### Charts Not Rendering
**Symptom**: Empty chart areas
**Solution**:
- Check if API responses contain data
- Verify time range has transactions
- Check browser console for errors

### Granularity Not Working
**Symptom**: Toggle doesn't change charts
**Solution**:
- Verify `granularity` state updates
- Check if `type` parameter sent to API
- Ensure backend supports hourly/daily types

### Export Not Working
**Symptom**: Nothing downloads
**Solution**:
- Check if chartRef attached to correct div
- Verify data array has items
- Check html2canvas installation

### Scores Show 0
**Symptom**: All executive scores are 0
**Solution**:
- Verify API responses have data
- Check if calculations handle empty arrays
- Ensure denominators aren't zero

## Future Enhancements

- [ ] Custom date range picker
- [ ] Compare two time periods side-by-side
- [ ] PDF report generation
- [ ] Email scheduled reports
- [ ] Chart drill-down (click for details)
- [ ] Forecast projections
- [ ] Anomaly detection
- [ ] Custom KPI builder
- [ ] Advanced filtering options

## Dependencies

```json
{
  "recharts": "^3.6.0",
  "@visx/heatmap": "^3.3.0",
  "@visx/hierarchy": "^3.3.0",
  "@visx/stats": "^3.5.0",
  "@visx/scale": "^3.5.0",
  "axios": "^1.6.2",
  "html2canvas": "^1.4.1",
  "lucide-react": "^0.561.0"
}
```

## File Structure

```
Reports.jsx (1000+ lines)
├── Main Component (Reports)
├── Data Processing Functions (8 functions)
├── useEffect Hooks (1 hook)
├── Render Logic
│   ├── Header with Time Range + Granularity
│   ├── 5 Sections
│   └── Export Buttons
└── Helper Components
    ├── Section
    ├── ChartCard
    ├── MetricCard
    └── ScoreCard
```

## Testing Checklist

- [ ] All 5 sections render
- [ ] All 7 chart types display correctly
- [ ] Time range selector updates all charts
- [ ] Granularity toggle changes data aggregation
- [ ] Export buttons download CSV/PNG
- [ ] Score cards show correct colors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Tooltips work on all charts
- [ ] Loading states show properly
- [ ] Empty states display correctly
- [ ] Branch prop properly received
- [ ] API errors handled gracefully
