# Order Lifecycle - Quick Reference

## 🔄 Status Flow

```
┌─────────┐      ┌───────────┐      ┌───────────┐      ┌───────┐      ┌──────┐      ┌────────┐
│ CREATED │─────>│ CONFIRMED │─────>│ PREPARING │─────>│ READY │─────>│ PAID │─────>│ CLOSED │
└─────────┘      └───────────┘      └───────────┘      └───────┘      └──────┘      └────────┘
     │                │                    │                │              │
     └────────────────┴────────────────────┴────────────────┘              X
                              │                                   (Cannot cancel
                              ↓                                    after PAID)
                        ┌───────────┐
                        │ CANCELLED │
                        └───────────┘
```

## 📋 Status Reference

| Status | Can Modify Items | Can Cancel | Can Pay | Next Status | Icon |
|--------|-----------------|------------|---------|-------------|------|
| CREATED | ✅ Yes | ✅ Yes | ❌ No | CONFIRMED | 📦 |
| CONFIRMED | ✅ Yes | ✅ Yes | ❌ No | PREPARING | ✓ |
| PREPARING | ❌ No | ✅ Yes | ❌ No | READY | 👨‍🍳 |
| READY | ❌ No | ✅ Yes | ✅ Yes | PAID | 🚚 |
| PAID | ❌ No | ❌ No | N/A | CLOSED | 💵 |
| CLOSED | ❌ No | ❌ No | N/A | Terminal | 📁 |
| CANCELLED | ❌ No | ❌ No | N/A | Terminal | ❌ |

## 🔌 API Endpoints

### Update Status
```bash
PUT /api/orders/:id/status
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "status": "confirmed"
}
```

### Checkout (READY → PAID)
```bash
POST /api/orders/:id/checkout
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "paymentMethod": "cash",
  "amountPaid": 450.00
}
```

### Close Order (PAID → CLOSED)
```bash
POST /api/orders/:id/close
Authorization: Bearer TOKEN
```

### Cancel Order
```bash
POST /api/orders/:id/cancel
Authorization: Bearer TOKEN
```

## 📡 Socket Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `order_created` | Order created | `{ orderId, orderNumber, table, status, total }` |
| `order_status_changed` | Status updated | `{ orderId, orderNumber, table, previousStatus, newStatus, timestamp }` |
| `order_paid` | Payment completed | `{ orderId, orderNumber, table, paymentMethod, total }` |
| `order_closed` | Order closed | `{ orderId, orderNumber, table, timestamp }` |
| `order_cancelled` | Order cancelled | `{ orderId, orderNumber, table, previousStatus, timestamp }` |

## ⚠️ Validation Rules

### Status Transitions
- ✅ Must follow linear flow (no skipping)
- ❌ Cannot transition from terminal states (CLOSED, CANCELLED)
- ✅ Can cancel from any non-terminal state except PAID

### Payment Rules
- ✅ Order must be in READY status
- ✅ Amount paid >= order total
- ❌ Cannot pay PREPARING/CREATED orders

### Item Modification
- ✅ Allowed: CREATED, CONFIRMED
- ❌ Blocked: PREPARING, READY, PAID, CLOSED, CANCELLED

## 🎨 Frontend Status Badges

```jsx
// Status badge colors
created: 'gray'      // 📦 Package icon
confirmed: 'blue'    // ✓ CheckCircle icon
preparing: 'orange'  // 👨‍🍳 ChefHat icon
ready: 'purple'      // 🚚 Truck icon
paid: 'green'        // 💵 DollarSign icon
closed: 'gray'       // 📁 Archive icon
cancelled: 'red'     // ❌ XCircle icon
```

## 🔑 Key Functions

### Backend
```javascript
// Validate transition
validateStatusTransition(currentStatus, newStatus);

// Emit event
emitToBranch(branchId, 'order_status_changed', data);

// Update stats
triggerStatsUpdate(branchId);
```

### Frontend
```javascript
// Get next status
getNextStatus(order.status);

// Handle transition
handleStatusTransition(orderId, newStatus);

// Get badge config
getStatusBadge(status);
```

## 🧪 Testing Checklist

- [ ] Create order → CREATED
- [ ] Confirm → CONFIRMED
- [ ] Start preparing → PREPARING
- [ ] Mark ready → READY
- [ ] Complete payment → PAID
- [ ] Close order → CLOSED
- [ ] Cancel from CREATED → CANCELLED
- [ ] Try skip (CREATED → READY) → Should fail
- [ ] Try pay from PREPARING → Should fail
- [ ] Try cancel PAID → Should fail
- [ ] Try modify PAID order items → Should fail
- [ ] Verify socket events emitted
- [ ] Check stats update triggered

## 🚨 Common Errors

```json
// Invalid transition
{
  "message": "Invalid transition: created → ready. Expected: created → confirmed"
}

// Terminal state
{
  "message": "Cannot change status from closed"
}

// Payment not ready
{
  "message": "Order must be in READY status before payment. Current status: preparing"
}

// Insufficient payment
{
  "message": "Insufficient payment amount"
}

// Cannot cancel
{
  "message": "Cannot cancel paid order"
}
```

## 📊 Stats Updates

Triggered on:
- ✅ Order created
- ✅ Status changed
- ✅ Order paid
- ✅ Order closed
- ✅ Order cancelled

Updates:
- Revenue metrics
- Active orders count
- Completed orders count
- Table occupancy

## 🎯 Usage Flow

### Manager Workflow
1. **New Order Arrives** (CREATED)
   - Review items
   - Click "Confirm" → CONFIRMED

2. **Send to Kitchen** (CONFIRMED)
   - Click "Start Preparing" → PREPARING
   - Kitchen receives notification

3. **Kitchen Completes** (PREPARING)
   - Click "Mark Ready" → READY
   - Notify server/customer

4. **Customer Pays** (READY)
   - Select payment method
   - Enter amount
   - Click "Complete Payment" → PAID

5. **Table Cleared** (PAID)
   - Click "Close Order" → CLOSED
   - Table marked available

### Cancel Flow
- Can cancel at any time before PAID
- Click "Cancel Order" button
- Order removed from table
- Stats updated

## 📱 UI Components

### Order Card
- Status badge (colored with icon)
- Payment status badge
- One-click access to details

### Order Modal
- Current status badge
- Next status button (if available)
- Payment section (only when READY)
- Close button (only when PAID)
- Cancel button (if allowed)
- Item list (modify if allowed)

## 🔗 Related Files

**Backend:**
- `server/models/Order.js` - Schema with new statuses
- `server/controllers/orderController.js` - Status validation & transitions
- `server/routes/orderRoutes.js` - API endpoints
- `server/services/realtimeService.js` - Socket events & stats

**Frontend:**
- `client/src/admins/components/branch/Orders.jsx` - UI with status management

**Documentation:**
- `docs/ORDER_LIFECYCLE.md` - Full documentation
- `docs/API_DOCUMENTATION.md` - API reference
