# Reports Page - Quick Start Guide

## ✅ Complete Implementation

### **5 Sections Built**
1. ✅ **Revenue & Growth** - Growth trends + seasonality curves
2. ✅ **Day/Date/Time Patterns** - Weekday analysis + hourly heatmap
3. ✅ **Menu Intelligence** - Lifecycle scatter + revenue treemap
4. ✅ **Risk/Reliability/Health** - Metrics + order distribution box plot
5. ✅ **Executive Summary** - 4 derived scores + key metrics

### **Chart Types Implemented**
- ✅ Composed Chart (bars + line)
- ✅ Area Chart (seasonality curve)
- ✅ Bar Chart (weekday comparison)
- ✅ Visx Heatmap (hour-by-hour)
- ✅ Visx Scatter Plot (menu lifecycle)
- ✅ Visx Treemap (revenue distribution)
- ✅ Visx Box Plot (order values)

### **Key Features**
- ✅ Granularity toggles (daily/weekly/monthly)
- ✅ REST API integration (no Socket.IO)
- ✅ Derived metrics with smart calculations
- ✅ CSV/PNG export for all charts
- ✅ Reused TimeRangeSelector from Stats

## How to Use

### 1. Navigate to Reports
Click "Reports" in the sidebar navigation.

### 2. Select Time Range
Use the dropdown at top right:
- 15min, 1h, 6h, today, 7d, 30d

### 3. Choose Granularity
Three buttons next to time range:
- **Daily**: Shows hourly breakdown
- **Weekly**: Shows daily breakdown
- **Monthly**: Shows weekly breakdown

### 4. Explore Sections

#### Revenue & Growth
- **Left**: Revenue bars + growth % line (dual axes)
- **Right**: Seasonality curve (weekly/monthly averages)

#### Day/Date/Time Patterns
- **Left**: Weekday performance (revenue + orders by day)
- **Right**: Hour-by-hour heatmap (activity intensity)

#### Menu Intelligence
- **Left**: Scatter plot (velocity vs revenue, sized by orders)
- **Right**: Treemap (revenue contribution by item)

#### Risk, Reliability & Health
- **Top**: 4 metric cards (reliability, failure rate, response time, stress)
- **Bottom**: Box plot (order value distribution by payment method)

#### Executive Summary
- **Top**: 4 score cards (performance, efficiency, stability, risk)
- **Bottom**: Key metrics summary (totals)

### 5. Export Data
Four export buttons at bottom:
- Revenue Growth → CSV + PNG
- Seasonality → CSV + PNG
- Weekday Pattern → CSV + PNG
- Hourly Heatmap → CSV only

## Understanding the Scores

### Performance Score (0-100)
**What it measures**: Revenue momentum compared to historical average

**Formula**: `(Recent 7-day Avg Revenue / Overall Avg Revenue) * 100`

**Interpretation**:
- **≥70** (Green): Strong performance, revenue growing
- **40-69** (Yellow): Moderate performance, stable revenue
- **<40** (Red): Weak performance, revenue declining

### Efficiency Score (0-100)
**What it measures**: Operational efficiency (velocity + turnaround)

**Formula**: `(Avg Item Velocity * 10 + Turnaround Score) / 2`
- Turnaround Score = `max(0, 100 - (Avg Turnaround * 2))`

**Interpretation**:
- **≥70** (Green): Highly efficient operations
- **40-69** (Yellow): Moderate efficiency
- **<40** (Red): Inefficient operations

### Stability Score (0-100)
**What it measures**: Payment system reliability

**Formula**: `Payment Success Rate`

**Interpretation**:
- **≥70** (Green): Very reliable payments
- **40-69** (Yellow): Moderate reliability
- **<40** (Red): Unreliable payments

### Risk Index (0-100, lower is better)
**What it measures**: Business risk factors

**Formula**: `Failure Rate + (Turnaround > 30 ? 30 : 0)`

**Interpretation**:
- **<40** (Green): Low risk, healthy business
- **40-69** (Yellow): Moderate risk, watch closely
- **≥70** (Red): High risk, action needed

## Chart Interactions

### Hover Tooltips
All charts show exact values on hover:
- Revenue Growth: Revenue + Growth %
- Seasonality: Avg Revenue
- Weekday: Revenue + Orders
- Heatmap: Occupancy %
- Scatter: Name + Velocity + Revenue + Orders
- Treemap: Name + Revenue
- Box Plot: Min, Q1, Median, Q3, Max

### Visual Feedback
- Charts highlight on hover
- Tooltips follow cursor
- Color intensity shows magnitude

## Data Refresh

### Manual Refresh
Change time range or granularity → auto-refetches all data

### No Auto-Refresh
Reports page uses historical data only (no Socket.IO)

## Common Use Cases

### 1. Identify Growth Trends
**Goal**: See if revenue is growing or declining
**Chart**: Revenue Growth Trend
**Look for**: Positive growth % (orange line trending up)

### 2. Find Best Days
**Goal**: Determine which weekdays perform best
**Chart**: Weekday Performance
**Look for**: Tallest bars (highest revenue)

### 3. Spot Peak Hours
**Goal**: Identify busiest times
**Chart**: Hour-by-Hour Heatmap
**Look for**: Darkest cells (highest occupancy)

### 4. Analyze Menu Performance
**Goal**: See which items drive revenue
**Chart**: Menu Lifecycle Scatter
**Look for**: Top-right quadrant (high velocity + high revenue)

### 5. Revenue Distribution
**Goal**: Understand revenue sources
**Chart**: Revenue Treemap
**Look for**: Largest blocks (top revenue contributors)

### 6. Check Payment Reliability
**Goal**: Assess payment system health
**Metrics**: Reliability score + Failure rate
**Look for**: High reliability (>90%), low failure (<5%)

### 7. Order Value Analysis
**Goal**: Understand order value spread
**Chart**: Order Value Distribution Box Plot
**Look for**: Wide boxes = high variability, narrow = consistent

### 8. Overall Health Check
**Goal**: Quick business health snapshot
**Section**: Executive Summary
**Look for**: All scores >70, risk index <40

## Troubleshooting

### "Loading reports..." never ends
**Cause**: API not responding
**Fix**: Check if backend server is running
**Check**: Browser console for error messages

### Charts show "No data available"
**Cause**: No transactions in selected time range
**Fix**: Choose longer time range (e.g., 30d instead of 15min)
**Check**: Verify orders exist in database

### Granularity toggle doesn't change charts
**Cause**: Backend doesn't support type parameter
**Fix**: Ensure analytics endpoints accept `?type=hourly` or `?type=daily`
**Check**: Network tab to verify API calls

### Scores all show 0
**Cause**: Insufficient data or calculation error
**Fix**: Ensure time range has enough orders (>10)
**Check**: Console for calculation errors

### Export doesn't download
**Cause**: chartRef not attached or data empty
**Fix**: Verify ref is on correct div, data array has items
**Check**: Browser console for export errors

### Heatmap cells missing
**Cause**: Table heatmap data incomplete
**Fix**: Ensure backend returns hour/table/occupancy structure
**Check**: API response format matches expected schema

## Performance Tips

1. **Use Appropriate Time Range**
   - Short ranges (15min-1h): Fast, limited data
   - Long ranges (30d): Slower, comprehensive data

2. **Granularity Selection**
   - Daily: Best for short ranges (<7d)
   - Weekly: Best for medium ranges (7-30d)
   - Monthly: Best for long ranges (>30d)

3. **Export Large Datasets**
   - Use CSV for data analysis
   - Use PNG for presentations
   - Export during off-peak hours

4. **Browser Performance**
   - Close unused tabs
   - Clear browser cache if sluggish
   - Use recent Chrome/Firefox/Edge

## Mobile Usage

### Responsive Layout
- Single column on mobile
- Charts stack vertically
- Full width for better visibility

### Touch Interactions
- Tap charts to see tooltips
- Pinch to zoom on mobile
- Scroll sections independently

### Export on Mobile
- CSV downloads to device
- PNG may require larger screen
- Use "Share" to send reports

## Next Steps

1. **Explore Each Section**: Click through all 5 sections
2. **Try Different Ranges**: Compare 7d vs 30d trends
3. **Toggle Granularity**: See how daily/weekly/monthly differ
4. **Export Sample**: Download CSV to analyze in Excel
5. **Check Scores**: Monitor executive summary scores
6. **Identify Patterns**: Look for recurring trends

## Best Practices

- Review reports daily for performance tracking
- Export weekly for team meetings
- Compare time ranges for trend analysis
- Monitor risk metrics closely
- Track score improvements over time
- Use scatter plot to optimize menu
- Identify peak hours for staffing

## Support

For issues or questions:
1. Check REPORTS_DOCUMENTATION.md for detailed info
2. Review browser console for errors
3. Verify API endpoints are accessible
4. Ensure backend analytics service is running
5. Check if data exists for selected time range
