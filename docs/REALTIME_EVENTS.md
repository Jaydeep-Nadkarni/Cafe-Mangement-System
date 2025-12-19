# Real-Time Events System

## Overview

The cafe management system now includes a comprehensive real-time broadcasting system using Socket.IO with the following features:

- **Throttled Stats Updates**: Periodic updates every 7 seconds
- **Instant Critical Events**: Immediate broadcasts for important actions
- **Room-Based Broadcasting**: Branch-isolated event streams
- **Debouncing Logic**: Prevents socket flooding
- **MongoDB Change Streams**: Automatic event detection

## Event Types

### 1. Periodic Events (Throttled - Every 7 seconds)

#### `stats_update`
Broadcast to all connected clients in a branch room every 7 seconds.

**Payload:**
```javascript
{
  revenue: 1500.50,           // Revenue in last hour
  transactions: 25,            // Transaction count
  orders: {                    // Order status breakdown
    pending: 5,
    in_progress: 3,
    completed: 17
  },
  tables: {                    // Table status breakdown
    occupied: 8,
    available: 12,
    reserved: 2,
    maintenance: 1
  },
  activeOrders: 8,             // Currently active orders
  timeRange: '1h',
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

### 2. Critical Events (Instant)

#### `critical_metric_update`
Emitted immediately when critical events occur (new order, payment, table status change).

**Payload:**
```javascript
{
  type: 'new_order' | 'payment_confirmation' | 'table_status_change',
  priority: 'high' | 'medium',
  orderId: '...',              // Or tableId for table events
  data: { /* Full document */ },
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

#### `new_order`
Triggered when a new order is created.

**Payload:**
```javascript
{
  orderId: '676...',
  data: {
    orderNumber: 'MAIN-123456-789',
    items: [...],
    total: 150.50,
    status: 'pending',
    // ... full order object
  },
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

#### `order_status_change`
Triggered when order status updates (pending → in_progress → completed).

**Payload:**
```javascript
{
  orderId: '676...',
  status: 'completed',
  data: { /* Full order */ },
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

#### `payment_confirmation`
Triggered when payment is confirmed.

**Payload:**
```javascript
{
  orderId: '676...',
  data: {
    paymentMethod: 'card',
    paymentStatus: 'paid',
    total: 150.50,
    // ... full order
  },
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

#### `table_occupancy_change`
Triggered when table status changes (available ↔ occupied ↔ reserved ↔ maintenance).

**Payload:**
```javascript
{
  tableId: '676...',
  tableNumber: 7,
  previousStatus: 'available',
  newStatus: 'occupied',
  data: { /* Full table object */ },
  timestamp: '2025-12-18T10:30:00.000Z'
}
```

### 3. Debounced Events (2 second delay)

#### `order_update`
Non-critical order updates (items added, notes changed).

#### `table_added` / `table_removed`
Table management operations.

### 4. Alert Events

#### `new_alert`
System-generated alerts for important events.

**Payload:**
```javascript
{
  _id: '676...',
  branch: '676...',
  type: 'order' | 'payment' | 'system',
  title: 'New Order',
  message: 'New order #MAIN-123456 received',
  relatedId: '676...',
  isRead: false,
  createdAt: '2025-12-18T10:30:00.000Z'
}
```

## Client Implementation

### Connect to Socket.IO

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  credentials: true
});

// Join branch room
socket.emit('joinBranch', branchId);

// Listen for join confirmation
socket.on('joined', (data) => {
  console.log('Joined room:', data.room);
});
```

### Subscribe to Events

```javascript
// Periodic stats updates (every 7 seconds)
socket.on('stats_update', (stats) => {
  console.log('Stats:', stats);
  updateDashboard(stats);
});

// Critical events (instant)
socket.on('critical_metric_update', (event) => {
  console.log('Critical event:', event);
  showNotification(event);
});

// New orders (instant)
socket.on('new_order', (order) => {
  console.log('New order:', order);
  playNotificationSound();
  refreshOrderList();
});

// Order status changes
socket.on('order_status_change', (data) => {
  console.log('Order status:', data);
  updateOrderStatus(data.orderId, data.status);
});

// Payment confirmations (instant)
socket.on('payment_confirmation', (payment) => {
  console.log('Payment received:', payment);
  markOrderAsPaid(payment.orderId);
});

// Table status changes (instant)
socket.on('table_occupancy_change', (table) => {
  console.log('Table status:', table);
  updateTableDisplay(table.tableNumber, table.newStatus);
});

// Alerts
socket.on('new_alert', (alert) => {
  console.log('Alert:', alert);
  showAlert(alert);
});
```

### Cleanup

```javascript
// Leave room when component unmounts
socket.emit('leaveBranch', branchId);
socket.disconnect();
```

## Backend Usage

### Automatic Events

Most events are automatically handled by MongoDB Change Streams. No manual intervention needed for:
- Order creation/updates
- Table status changes
- Payment confirmations

### Manual Event Emission

For custom events not covered by Change Streams:

```javascript
const { emitToBranch, triggerStatsUpdate } = require('./services/realtimeService');

// Emit custom event
emitToBranch(branchId, 'inventory_updated', {
  itemId: '676...',
  isAvailable: false
});

// Trigger immediate stats update
triggerStatsUpdate(branchId);
```

## Configuration

### Throttle Settings

```javascript
const THROTTLE_INTERVAL = 7000; // 7 seconds between stats updates
const DEBOUNCE_DELAY = 2000;    // 2 second debounce for non-critical updates
```

### Room Structure

All events are scoped to branch rooms:
- Room format: `branch_${branchId}`
- Clients must join their branch room to receive events
- Events are isolated per branch

## Performance Considerations

1. **Automatic Cleanup**: Periodic updates stop when no clients are connected to a room
2. **Throttling**: Stats updates limited to once per 7 seconds per branch
3. **Debouncing**: Non-critical updates delayed by 2 seconds to batch changes
4. **Room-Based**: Events only sent to relevant branch, not broadcast globally

## Requirements

- **MongoDB**: Replica Set or Atlas Cluster required for Change Streams
- **Socket.IO**: v4.x
- **Node.js**: v16+

## Troubleshooting

### Change Streams Not Working

If you see "Failed to initialize Change Stream" errors:
- Ensure MongoDB is running in Replica Set mode
- Or use MongoDB Atlas (automatically supports Change Streams)
- Local MongoDB: Initialize replica set with `rs.initiate()`

### Stats Not Updating

- Check that client joined branch room (`socket.emit('joinBranch', branchId)`)
- Verify Socket.IO connection is established
- Check server logs for room join confirmations

### Events Not Received

- Ensure client is listening to correct event names
- Verify branchId is correct
- Check network connectivity
- Look for CORS issues in browser console
