# Order Lifecycle Implementation

## Overview
Strict order lifecycle system with status validation, preventing status skipping, and ensuring payment verification before completion. Includes real-time socket events and stats updates on every status change.

## Order Lifecycle States

### State Flow
```
CREATED → CONFIRMED → PREPARING → READY → PAID → CLOSED
          ↓
      CANCELLED (from any non-terminal state)
```

### Status Definitions

#### 1. CREATED
- **Initial state** when order is first placed
- Customer has placed order but not yet confirmed
- Can add/remove items freely
- **Transitions to:** CONFIRMED or CANCELLED

#### 2. CONFIRMED
- Order has been confirmed by manager/customer
- Items locked in, ready for kitchen
- **Transitions to:** PREPARING or CANCELLED

#### 3. PREPARING
- Kitchen is actively preparing the order
- Items cannot be modified
- **Transitions to:** READY or CANCELLED

#### 4. READY
- Order is ready for serving/delivery
- **Transitions to:** PAID or CANCELLED
- **Payment validation enforced here**

#### 5. PAID
- Payment has been completed and verified
- Order cannot be cancelled
- Table still occupied (customer may be finishing)
- **Transitions to:** CLOSED only

#### 6. CLOSED
- **Terminal state**
- Order complete, table cleared
- Removed from table's currentOrders
- Table marked available (if no other orders)
- **No further transitions**

#### 7. CANCELLED
- **Terminal state**
- Order cancelled before payment
- Table cleared immediately
- **No further transitions**

## Backend Implementation

### Model Changes (`server/models/Order.js`)

```javascript
status: {
  type: String,
  enum: ['created', 'confirmed', 'preparing', 'ready', 'paid', 'closed', 'cancelled'],
  default: 'created',
  index: true
}
```

### Status Transition Validation

```javascript
const STATUS_FLOW = {
  created: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'paid',
  paid: 'closed',
  closed: null // Terminal
};

const validateStatusTransition = (currentStatus, newStatus) => {
  // Allow cancellation from non-terminal states
  if (newStatus === 'cancelled' && !['paid', 'closed', 'cancelled'].includes(currentStatus)) {
    return { valid: true };
  }

  // Block changes from terminal states
  if (['closed', 'cancelled'].includes(currentStatus)) {
    return { 
      valid: false, 
      message: `Cannot change status from ${currentStatus}` 
    };
  }

  // Check for status skipping
  const expectedNext = STATUS_FLOW[currentStatus];
  if (newStatus !== expectedNext) {
    return { 
      valid: false, 
      message: `Invalid transition: ${currentStatus} → ${newStatus}. Expected: ${expectedNext}` 
    };
  }

  return { valid: true };
};
```

### API Endpoints

#### 1. Update Order Status
**Endpoint:** `PUT /api/orders/:id/status`  
**Auth:** Required (Manager)

**Request:**
```json
{
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated: created → confirmed",
  "order": { ... }
}
```

**Validation:**
- Checks current status allows transition
- Prevents status skipping
- Blocks terminal state changes
- Emits socket event: `order_status_changed`
- Triggers stats update

#### 2. Checkout Order (READY → PAID)
**Endpoint:** `POST /api/orders/:id/checkout`  
**Auth:** Required (Manager)

**Request:**
```json
{
  "paymentMethod": "cash",
  "amountPaid": 450.00
}
```

**Validation:**
- Order must be in READY status
- Amount paid must be >= order total
- Cannot checkout cancelled/closed orders

**Side Effects:**
- Updates: `paymentMethod`, `paymentStatus`, `paidAt`, `status`
- Emits socket event: `order_paid`
- Triggers stats update

#### 3. Close Order (PAID → CLOSED)
**Endpoint:** `POST /api/orders/:id/close`  
**Auth:** Required (Manager)

**Validation:**
- Order must be in PAID status

**Side Effects:**
- Sets status to 'closed'
- Sets `completedAt` timestamp
- Removes from table's `currentOrders` array
- Marks table as available (if no other orders)
- Emits socket event: `order_closed`
- Triggers stats update

#### 4. Cancel Order
**Endpoint:** `POST /api/orders/:id/cancel`  
**Auth:** Required (Manager)

**Validation:**
- Cannot cancel PAID, CLOSED, or CANCELLED orders

**Side Effects:**
- Sets status to 'cancelled'
- Removes from table's `currentOrders` array
- Marks table as available (if no other orders)
- Emits socket event: `order_cancelled`
- Triggers stats update

## Socket Events

All status changes emit real-time events to the branch room:

### 1. order_created
```javascript
{
  orderId: "...",
  orderNumber: "ORD-123456-789",
  table: "tableId",
  status: "created",
  total: 450.00
}
```

### 2. order_status_changed
```javascript
{
  orderId: "...",
  orderNumber: "ORD-123456-789",
  table: 5,
  previousStatus: "confirmed",
  newStatus: "preparing",
  timestamp: "2024-12-20T10:30:00Z"
}
```

### 3. order_paid
```javascript
{
  orderId: "...",
  orderNumber: "ORD-123456-789",
  table: 5,
  paymentMethod: "cash",
  total: 450.00
}
```

### 4. order_closed
```javascript
{
  orderId: "...",
  orderNumber: "ORD-123456-789",
  table: 5,
  timestamp: "2024-12-20T10:35:00Z"
}
```

### 5. order_cancelled
```javascript
{
  orderId: "...",
  orderNumber: "ORD-123456-789",
  table: 5,
  previousStatus: "preparing",
  timestamp: "2024-12-20T10:32:00Z"
}
```

## Frontend Implementation

### Status Badge Component

Visual indicators for each status:

| Status | Icon | Color | Label |
|--------|------|-------|-------|
| created | Package | Gray | Created |
| confirmed | CheckCircle | Blue | Confirmed |
| preparing | ChefHat | Orange | Preparing |
| ready | Truck | Purple | Ready |
| paid | DollarSign | Green | Paid |
| closed | Archive | Gray | Closed |
| cancelled | XCircle | Red | Cancelled |

### UI Features

#### Order Cards
- Display both order status and payment status
- Status badge shows current lifecycle state
- Visual color coding for quick identification
- Disabled actions for terminal states

#### Order Detail Modal

**Status Transition Section:**
- Shows current status badge
- Displays next available transition
- One-click button to advance to next status
- Disabled when payment validation required
- Shows "Close Order" button when status is PAID

**Payment Section:**
- Only enabled when order status is READY
- Validates amount paid >= total
- Changes status from READY → PAID
- Info message shown when not in READY status

**Action Buttons:**
- Cancel: Available for non-terminal states
- Add/Remove Items: Disabled for PAID/CLOSED
- Status Transition: Shows next valid step
- Close Order: Only for PAID status

### Status Transition Flow (Frontend)

```javascript
// Get next valid status
const getNextStatus = (currentStatus) => {
  const flow = {
    created: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'paid',
    paid: 'closed'
  };
  return flow[currentStatus];
};

// Handle transition
const handleStatusTransition = async (orderId, newStatus) => {
  await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
  // Refresh orders
  // Show success message
  // Emit socket handled by backend
};
```

## Validation Rules

### Status Transition Rules

1. **Linear Progression Only**
   - Must follow: CREATED → CONFIRMED → PREPARING → READY → PAID → CLOSED
   - Cannot skip states (e.g., CREATED → READY is invalid)

2. **Terminal States**
   - CLOSED and CANCELLED cannot transition to any state
   - Once PAID, can only move to CLOSED

3. **Payment Validation**
   - Order must be READY before payment
   - Amount paid must be >= order total
   - Payment sets status to PAID automatically

4. **Cancellation Rules**
   - Can cancel from: CREATED, CONFIRMED, PREPARING, READY
   - Cannot cancel from: PAID, CLOSED, CANCELLED

### Item Modification Rules

- **Allowed:** CREATED, CONFIRMED
- **Blocked:** PREPARING, READY, PAID, CLOSED, CANCELLED

## Stats Updates

All status changes trigger immediate stats update:

```javascript
// Triggered on:
- Order created
- Status changed
- Order paid
- Order closed
- Order cancelled

// Updates:
- Real-time revenue metrics
- Active orders count
- Completed orders count
- Table occupancy status
```

## Error Handling

### Common Errors

**Invalid Transition:**
```json
{
  "message": "Invalid transition: created → ready. Expected: created → confirmed"
}
```

**Terminal State:**
```json
{
  "message": "Cannot change status from closed"
}
```

**Payment Not Ready:**
```json
{
  "message": "Order must be in READY status before payment. Current status: preparing"
}
```

**Insufficient Payment:**
```json
{
  "message": "Insufficient payment amount"
}
```

## Testing Scenarios

### Happy Path
1. Create order → Status: CREATED ✓
2. Confirm order → Status: CONFIRMED ✓
3. Start preparing → Status: PREPARING ✓
4. Mark ready → Status: READY ✓
5. Complete payment → Status: PAID ✓
6. Close order → Status: CLOSED ✓

### Validation Tests
- [ ] Try to skip from CREATED to READY → Should fail
- [ ] Try to pay when status is PREPARING → Should fail
- [ ] Try to modify PAID order items → Should fail
- [ ] Try to cancel PAID order → Should fail
- [ ] Try to change CLOSED order → Should fail
- [ ] Try payment with insufficient amount → Should fail

### Socket Event Tests
- [ ] Create order → order_created emitted
- [ ] Change status → order_status_changed emitted
- [ ] Complete payment → order_paid emitted
- [ ] Close order → order_closed emitted
- [ ] Cancel order → order_cancelled emitted
- [ ] Verify stats update triggered on each event

## Migration Guide

### Updating Existing Orders

Run this migration script to update existing orders:

```javascript
// Migration script
const Order = require('./models/Order');

async function migrateOrders() {
  // Map old statuses to new lifecycle
  const statusMap = {
    'pending': 'created',
    'in_progress': 'preparing',
    'completed': 'paid', // or 'closed' based on table status
    'cancelled': 'cancelled'
  };

  const orders = await Order.find({ status: { $in: Object.keys(statusMap) } });
  
  for (const order of orders) {
    const newStatus = statusMap[order.status];
    
    // If completed and table is cleared, mark as closed
    if (order.status === 'completed' && order.paymentStatus === 'paid') {
      const table = await Table.findById(order.table);
      if (table && !table.currentOrders.includes(order._id)) {
        order.status = 'closed';
      } else {
        order.status = 'paid';
      }
    } else {
      order.status = newStatus;
    }
    
    await order.save();
  }
  
  console.log(`Migrated ${orders.length} orders`);
}
```

## Performance Considerations

- Status transitions are lightweight (single field update)
- Socket events use room-based broadcasting (efficient)
- Stats updates are throttled (7-second interval)
- Indexes on status field for fast queries
- Compound indexes for common queries (branch + status + date)

## Future Enhancements

1. **Kitchen Display System (KDS)**
   - Auto-transition from CONFIRMED → PREPARING
   - Kitchen staff marks items READY
   - Integration with preparation timers

2. **Status History Tracking**
   - Store all status changes with timestamps
   - Audit trail for compliance
   - Performance metrics (time in each state)

3. **Automated Transitions**
   - Auto-confirm after X minutes
   - Auto-close PAID orders after table cleared
   - Reminder notifications for stuck orders

4. **Customer Notifications**
   - SMS/WhatsApp on status changes
   - "Your order is ready" alerts
   - Real-time status tracking page

## Summary

✅ **Implemented:**
- Strict lifecycle: CREATED → CONFIRMED → PREPARING → READY → PAID → CLOSED
- Status transition validation (no skipping)
- Payment verification before PAID
- Socket events on every status change
- Stats updates via triggerStatsUpdate
- Frontend UI with status badges and transition buttons
- Payment only when READY
- Close order functionality (PAID → CLOSED)

✅ **Enforced:**
- Linear progression only
- Terminal state protection
- Payment amount validation
- Item modification restrictions
- Cancel rules (not after PAID)

✅ **Real-time:**
- All status changes emit socket events
- Immediate stats refresh
- Live UI updates
- Branch-specific broadcasting
