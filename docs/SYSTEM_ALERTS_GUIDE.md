# System-Generated Alerts - Complete Implementation

## Overview

A comprehensive automated alert system that monitors critical business metrics and generates intelligent alerts for anomalies, failures, and suspicious activities. Alerts are categorized by severity (Info, Warning, Critical), timestamped, and appear in the Alerts dashboard with real-time notifications.

**Key Features:**
- ✅ 7 distinct alert types covering payment, revenue, inventory, and abuse detection
- ✅ Severity levels (Info, Warning, Critical)
- ✅ Real-time WebSocket notifications via Socket.io
- ✅ Timestamped and categorized alerts
- ✅ System-generated vs manual alert distinction
- ✅ Rich metadata tracking with metrics and thresholds
- ✅ Unread count badge with notification UI
- ✅ Mark as read, dismiss, and delete functionality
- ✅ System status indicators in frontend
- ✅ Periodic automated monitoring (5-minute intervals)

## Alert Types

### 1. **Payment Gateway Failures** (`payment_failure`)
**Severity:** Critical  
**Trigger:** 3+ failed payments within 1 hour  
**Metadata:**
- `metric`: 'failed_payments'
- `value`: Number of failures
- `threshold`: 3
- `timeWindow`: '1 hour'

**Purpose:** Immediate notification when payment processing is having issues

**Example:** 
```
"5 payment failures detected in the last hour. Check payment gateway connection."
```

### 2. **Unusual Revenue Drop** (`revenue_drop`)
**Severity:** Warning  
**Trigger:** Today's revenue > 30% below 7-day average  
**Metadata:**
- `metric`: 'daily_revenue'
- `value`: Today's total
- `threshold`: Weekly average
- `dropPercent`: Drop percentage
- `weeklyAverage`: Average daily revenue

**Purpose:** Alert admin to unusual business decline that may indicate operational issues

**Example:**
```
"Today's revenue (₹2,500) is 45.2% below weekly average (₹4,545)."
```

### 3. **Too Many Unpaid Tables** (`unpaid_tables`)
**Severity:** Warning | Critical (if >70% occupied)  
**Trigger:** 5+ pending orders within 4 hours  
**Metadata:**
- `metric`: 'unpaid_orders'
- `value`: Number of pending orders
- `occupiedTables`: Count of occupied tables
- `totalTables`: Total table count
- `occupancyRatio`: Percentage occupied
- `threshold`: 5

**Purpose:** Alert to revenue leakage from unpaid customers

**Example:**
```
"8 orders with pending payment. 6 of 10 tables occupied."
```

### 4. **Inventory Stock-Out Risk** (`inventory_stockout`)
**Severity:** Warning | Critical (if out of stock)  
**Trigger:** Menu items with stock ≤ 5 or stock = 0  
**Metadata:**
- `metric`: 'low_stock' | 'out_of_stock'
- `value`: Number of affected items
- `affectedItems`: Array of item IDs

**Purpose:** Prevent stockouts and lost orders

**Example Low Stock:**
```
"Items running low: Paneer Tikka (3), Butter Chicken (2). Consider reordering soon."
```

**Example Out of Stock:**
```
"Items out of stock: Coke 2L, Sprite. Please reorder immediately."
```

### 5. **Repeated Order Edits** (`order_edit_abuse`)
**Severity:** Warning  
**Trigger:** Order edited >5 times within 1 hour  
**Metadata:**
- `metric`: 'order_edits'
- `value`: Edit count
- `threshold`: 5
- `timeWindow`: '1 hour'
- `affectedRecords`: [orderId]

**Purpose:** Detect accidental/intentional order manipulation that affects accuracy

**Example:**
```
"Order #A1B2 has been edited 7 times in the last hour."
```

### 6. **Excessive Manual Table Releases** (`table_release_abuse`)
**Severity:** Warning  
**Trigger:** >5 manual releases across tables in 1 hour  
**Metadata:**
- `metric`: 'manual_releases'
- `value`: Total manual releases
- `threshold`: 5
- `affectedTables`: Array of table numbers
- `timeWindow`: '1 hour'

**Purpose:** Detect tables being force-released incorrectly, indicating potential system issues or abuse

**Example:**
```
"Tables 2, 5, 8 have been manually released 6 times in the last hour."
```

### 7. **Coupon Abuse Detection** (`coupon_abuse`)
**Severity:** Warning | Critical (if >20 uses/hour)  
**Trigger:** 10+ coupon applications within 1 hour  
**Metadata:**
- `metric`: 'coupon_usage'
- `value`: Number of applications
- `totalDiscount`: Total discount given
- `threshold`: 10
- `affectedCoupons`: Array of coupon IDs
- `timeWindow`: '1 hour'

**Purpose:** Detect fraudulent or excessive coupon redemption patterns

**Example:**
```
"15 coupon applications in the last hour with ₹1,250 total discount. Possible abuse detected."
```

## Database Model Enhancement

### Alert Schema Additions

```javascript
// Alert.js - New Fields
{
  category: 'manual' | 'system' | 'automatic',
  severity: 'info' | 'warning' | 'critical',
  isSystemGenerated: Boolean,
  isResolved: Boolean,
  resolvedAt: Date,
  
  metadata: {
    metric: String,           // e.g., 'payment_failures', 'revenue_drop'
    value: Number,            // Current value that triggered alert
    threshold: Number,        // Threshold value
    previousValue: Number,    // For trend analysis
    failureCount: Number,     // For payment failures
    affectedRecords: Array    // Related record IDs
  }
}
```

### Indexes

```javascript
alertSchema.index({ branch: 1, isSystemGenerated: 1 });
alertSchema.index({ branch: 1, severity: 1 });
alertSchema.index({ branch: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1, createdAt: -1 });
```

## Service Layer Functions

### Core Alert Creation

**`createSystemAlert(alertConfig)`**
Creates and emits a system-generated alert

```javascript
await createSystemAlert({
  branch: branchId,
  type: 'payment_failure',
  severity: 'critical',
  title: 'Payment Gateway Issues',
  message: 'Description...',
  metadata: { /* ... */ },
  relatedId: orderId,
  onModel: 'Order'
});
```

### Individual Check Functions

Each function performs specific monitoring:

- `checkPaymentFailures(branchId)` - Monitor payment processing
- `checkRevenueAnomaly(branchId)` - Track daily revenue vs baseline
- `checkUnpaidTables(branchId)` - Monitor pending payments
- `checkInventoryStockOut(branchId)` - Track menu item stock levels
- `checkOrderEditAbuse(branchId, orderId)` - Detect order manipulation
- `checkTableReleaseAbuse(branchId)` - Monitor manual releases
- `checkCouponAbuse(branchId)` - Detect coupon fraud patterns

### Batch Operations

**`runAllSystemChecks(branchId)`**
Executes all checks in parallel

**`scheduleSystemChecks(branchId)`**
Sets up 5-minute interval monitoring

## Frontend Integration

### Enhanced Alert Display

Alerts now show:
- **Icon** - Specific icon for each alert type
- **Title** - Clear description
- **Severity Badge** - Color-coded severity level
- **System Indicator** - Purple "System" badge for auto-generated alerts
- **Metadata** - Metric details with current value and threshold
- **Timestamp** - When alert was created

### Unread Badge

```javascript
{unreadCount > 0 && (
  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
    {unreadCount} Unread
  </span>
)}
```

### Alert Type Labels

| Type | Display |
|------|---------|
| `payment_failure` | "Payment Issue" |
| `revenue_drop` | "Revenue Alert" |
| `unpaid_tables` | "Unpaid Orders" |
| `inventory_stockout` | "Stock Alert" |
| `order_edit_abuse` | "Order Abuse" |
| `table_release_abuse` | "Table Release" |
| `coupon_abuse` | "Coupon Abuse" |

### Severity Styling

```javascript
'info' → Blue badge (bg-blue-100, text-blue-800)
'warning' → Yellow badge (bg-yellow-100, text-yellow-800)
'critical' → Red badge (bg-red-100, text-red-800)
```

## Integration Points

### Order Operations
Track edits and prevent abuse:
```javascript
// In order update handler
await checkOrderEditAbuse(branchId, orderId);
```

### Table Management
Monitor manual releases:
```javascript
// In table release handler
await checkTableReleaseAbuse(branchId);
```

### Coupon Application
Detect fraud patterns:
```javascript
// In order payment handler
await checkCouponAbuse(branchId);
```

### Payment Processing
Track failures:
```javascript
// In payment webhook
await checkPaymentFailures(branchId);
```

### Periodic Monitoring
Background checks run every 5 minutes:
```javascript
// In branch initialization
scheduleSystemChecks(branchId);
```

## Configuration & Thresholds

All thresholds are configurable:

| Alert | Threshold | Window |
|-------|-----------|--------|
| Payment Failures | 3 failures | 1 hour |
| Revenue Drop | 30% below avg | Daily |
| Unpaid Tables | 5 orders | 4 hours |
| Low Stock | ≤5 items | Continuous |
| Out of Stock | 0 items | Continuous |
| Order Edits | >5 edits | 1 hour |
| Table Releases | >5 releases | 1 hour |
| Coupon Usage | ≥10 uses | 1 hour |

**To adjust thresholds**, modify the corresponding check function in `realtimeService.js`

## Usage Workflow

### 1. System Starts
```
Branch initialized
  ↓
scheduleSystemChecks(branchId) called
  ↓
5-minute interval monitoring begins
```

### 2. Alert Generated
```
Metric monitored every 5 minutes
  ↓
Threshold exceeded
  ↓
createSystemAlert() called
  ↓
Alert saved to DB
  ↓
Emitted to branch via Socket.io
  ↓
Appears in Alerts page immediately
```

### 3. Admin Reviews
```
Sees alert in Alerts page
  ↓
Clicks "Mark as Read" (check icon)
  ↓
Alert marked read, removed from "Unread" count
  ↓
Can dismiss with "X" or delete permanently
```

## Real-Time Updates

### WebSocket Events

```javascript
// Emitted when system alert created
io.to(`branch_${branchId}`).emit('new_alert', alertObject);

// Frontend listener
useBranchSocket(branchId, {
  onNewAlert: (alert) => {
    setAlerts(prev => [alert, ...prev]);
  }
});
```

### Notification Badge

```javascript
// In Alerts.jsx component
const unreadCount = alerts.filter(a => !a.isRead && !a.isDismissed).length;

// Display badge
{unreadCount > 0 && (
  <span className="bg-red-100 text-red-800 px-3 py-1">
    {unreadCount} Unread
  </span>
)}
```

## Best Practices

✅ **Do's:**
- Review system alerts regularly
- Investigate critical alerts immediately
- Use metadata to understand root cause
- Resolve related issues and mark alert resolved
- Check thresholds quarterly
- Monitor trends in alert frequency

❌ **Don'ts:**
- Ignore critical payment or stock alerts
- Set thresholds too low (generates noise)
- Delete alerts without review
- Disable monitoring
- Assume alerts resolve themselves

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No alerts appear | Check Socket.io connection, verify branch has active users |
| Too many alerts | Increase thresholds or adjust trigger conditions |
| Alert not created | Check database permissions, verify branch exists |
| Stale alerts showing | Implement resolve logic when issue is fixed |
| High CPU usage | Reduce check frequency or optimize aggregation queries |

## Performance Notes

- **Check Frequency:** 5-minute intervals (configurable)
- **Query Performance:** All checks use indexed queries
- **Parallel Execution:** `runAllSystemChecks()` uses Promise.all()
- **Memory:** Alert data stored in MongoDB, not in-memory
- **WebSocket:** Emits only create new alert (minimal overhead)
- **Scalability:** Per-branch monitoring allows multi-branch deployments

## Future Enhancements

1. **Alert Thresholds UI** - Admin dashboard to adjust thresholds
2. **Alert Rules Engine** - Custom alert conditions
3. **Escalation Policies** - Auto-escalate critical alerts
4. **Email Notifications** - Send critical alerts via email
5. **Alert Grouping** - Combine similar alerts
6. **Analytics** - Track alert frequency and resolution time
7. **Webhooks** - Send to external monitoring systems
8. **Snooze Alerts** - Temporarily dismiss recurring alerts
9. **Alert History** - Track when alerts were resolved
10. **Correlations** - Link related alerts together

## API Endpoints

### Get Alerts
```
GET /api/admin/alerts?branch=branchId&dismissed=false
```

### Mark as Read
```
PUT /api/admin/alerts/:id/read
```

### Dismiss Alert
```
PUT /api/admin/alerts/:id/dismiss
```

### Delete Alert
```
DELETE /api/admin/alerts/:id
```

## Files Modified

1. **server/models/Alert.js** - Enhanced with severity, category, metadata fields
2. **server/services/realtimeService.js** - Added 7 alert check functions + scheduler
3. **server/controllers/branchController.js** - Added check function imports
4. **client/src/admins/components/branch/Alerts.jsx** - Enhanced display with badges, icons, metadata

## References

- [Alert Model](../server/models/Alert.js)
- [RealTime Service](../server/services/realtimeService.js)
- [Alerts Component](../client/src/admins/components/branch/Alerts.jsx)
- [Branch Controller](../server/controllers/branchController.js)
