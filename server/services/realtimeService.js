const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Table = require('../models/Table');
const { getRealTimeStats } = require('./analyticsService');

/**
 * REAL-TIME SERVICE WITH LIVE STATS BROADCASTING
 * 
 * Features:
 * - Throttled stats updates every 5-10 seconds
 * - Instant critical event updates (new order, payment, table status)
 * - Room-based broadcasting for branch isolation
 * - Debouncing logic to prevent socket flooding
 * 
 * Event Types:
 * - stats_update: Periodic stats refresh (revenue, orders, tables)
 * - critical_metric_update: Instant critical events
 * - table_occupancy_change: Table status changes
 * - new_order: New order created
 * - order_status_change: Order status updated
 * - payment_confirmation: Payment completed
 */

// Store for throttling/debouncing
const updateQueues = new Map(); // branchId -> { lastUpdate, pendingUpdate, timeout }
const THROTTLE_INTERVAL = 7000; // 7 seconds between stats updates
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce for non-critical updates

/**
 * Initialize Real-time Service
 * @param {Server} io - Socket.io Server instance
 */
const initRealtime = (io) => {
  console.log('Initializing Real-time Service with Live Stats Broadcasting...');

  // Store io instance globally for use in other modules
  global.io = io;

  // Socket.io Connection Handler
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join Branch Room
    socket.on('joinBranch', (branchId) => {
      if (branchId) {
        const room = `branch_${branchId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
        socket.emit('joined', { room });

        // Send immediate stats update when joining
        sendStatsUpdate(branchId, io, true);

        // Start periodic stats updates for this branch
        startPeriodicStatsUpdates(branchId, io);
      }
    });

    // Leave Branch Room
    socket.on('leaveBranch', (branchId) => {
      if (branchId) {
        const room = `branch_${branchId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // MongoDB Change Stream for Orders
  try {
    const orderChangeStream = Order.watch([], { fullDocument: 'updateLookup' });

    orderChangeStream.on('change', (change) => {
      processOrderChange(change, io);
    });

    orderChangeStream.on('error', (error) => {
      console.error('Order Change Stream Error:', error);
    });

    console.log('Listening for Order collection changes...');
  } catch (error) {
    console.error('Failed to initialize Order Change Stream:', error.message);
  }

  // MongoDB Change Stream for Menu Items (availability changes)
  try {
    const MenuItem = require('../models/MenuItem');
    const menuChangeStream = MenuItem.watch([], { fullDocument: 'updateLookup' });

    menuChangeStream.on('change', (change) => {
      if (change.operationType === 'update') {
        const updatedFields = change.updateDescription?.updatedFields;
        if (updatedFields && ('isAvailable' in updatedFields)) {
          const menuItem = change.fullDocument;
          if (menuItem && menuItem.branch) {
            const branchId = menuItem.branch.toString();
            const room = `branch_${branchId}`;
            
            io.to(room).emit('menu_item_availability_changed', {
              itemId: menuItem._id,
              name: menuItem.name,
              isAvailable: updatedFields.isAvailable,
              timestamp: new Date()
            });
            
            // Trigger stats update
            triggerStatsUpdate(branchId);
          }
        }
      }
    });

    menuChangeStream.on('error', (error) => {
      console.error('MenuItem Change Stream Error:', error);
    });

    console.log('Listening for MenuItem collection changes...');
  } catch (error) {
    console.error('Failed to initialize MenuItem Change Stream:', error.message);
  }

  // MongoDB Change Stream for Tables
  try {
    const tableChangeStream = Table.watch([], { fullDocument: 'updateLookup' });

    tableChangeStream.on('change', (change) => {
      processTableChange(change, io);
    });

    tableChangeStream.on('error', (error) => {
      console.error('Table Change Stream Error:', error);
    });

    console.log('Listening for Table collection changes...');
  } catch (error) {
    console.error('Failed to initialize Table Change Stream:', error.message);
  }
};

/**
 * Start periodic stats updates for a branch
 * @param {String} branchId - Branch ID
 * @param {Server} io - Socket.io instance
 */
const startPeriodicStatsUpdates = (branchId, io) => {
  const room = `branch_${branchId}`;
  
  // Check if already running
  if (updateQueues.has(branchId) && updateQueues.get(branchId).interval) {
    return;
  }

  // Initialize update queue for this branch
  if (!updateQueues.has(branchId)) {
    updateQueues.set(branchId, {
      lastUpdate: 0,
      pendingUpdate: null,
      timeout: null,
      interval: null
    });
  }

  // Start interval for periodic updates
  const interval = setInterval(async () => {
    // Check if room has any connected clients
    const roomSockets = await io.in(room).fetchSockets();
    
    if (roomSockets.length === 0) {
      // No clients in room, stop updates
      clearInterval(interval);
      updateQueues.delete(branchId);
      console.log(`Stopped stats updates for ${room} (no clients)`);
      return;
    }

    sendStatsUpdate(branchId, io, false);
  }, THROTTLE_INTERVAL);

  updateQueues.get(branchId).interval = interval;
  console.log(`Started periodic stats updates for ${room}`);
};

/**
 * Send stats update to branch room
 * @param {String} branchId - Branch ID
 * @param {Server} io - Socket.io instance
 * @param {Boolean} immediate - Skip throttle check
 */
const sendStatsUpdate = async (branchId, io, immediate = false) => {
  const room = `branch_${branchId}`;
  const now = Date.now();
  const queue = updateQueues.get(branchId);

  // Throttle check
  if (!immediate && queue && (now - queue.lastUpdate) < THROTTLE_INTERVAL) {
    return;
  }

  try {
    // Fetch real-time stats
    const stats = await getRealTimeStats(branchId, '1h');

    // Add additional metrics
    const [activeTablesCount, availableTablesCount] = await Promise.all([
      Table.countDocuments({ branch: branchId, status: 'occupied' }),
      Table.countDocuments({ branch: branchId, status: 'available' })
    ]);

    const payload = {
      ...stats,
      tables: {
        ...stats.tables,
        occupied: activeTablesCount,
        available: availableTablesCount
      },
      timestamp: new Date()
    };

    io.to(room).emit('stats_update', payload);
    
    if (queue) {
      queue.lastUpdate = now;
    }
  } catch (error) {
    console.error(`Error sending stats update to ${room}:`, error.message);
  }
};

/**
 * Process and emit order changes
 * @param {Object} change - MongoDB Change Stream event
 * @param {Server} io - Socket.io Server instance
 */
const processOrderChange = async (change, io) => {
  const order = change.fullDocument;
  
  // Ensure we have an order and a branch ID to route the event
  if (!order || !order.branch) return;

  const branchId = order.branch.toString();
  const room = `branch_${branchId}`;
  
  let eventType = null;
  let isCritical = false;
  let payload = {
    orderId: order._id,
    data: order,
    timestamp: new Date()
  };

  let alertData = null;

  switch (change.operationType) {
    case 'insert':
      eventType = 'new_order';
      isCritical = true; // Critical: Instant update
      alertData = {
        type: 'order',
        title: 'New Order',
        message: `New order #${order.orderNumber || order._id.toString().slice(-4)} received`,
        relatedId: order._id
      };
      break;
      
    case 'update':
      const updatedFields = change.updateDescription.updatedFields;
      
      // Determine specific update type
      if (updatedFields.status) {
        eventType = 'order_status_change';
        payload.status = updatedFields.status;
        
        if (['ready', 'completed', 'cancelled'].includes(updatedFields.status)) {
          isCritical = true; // Critical status changes
          alertData = {
            type: 'system',
            title: 'Order Update',
            message: `Order #${order.orderNumber || order._id.toString().slice(-4)} is ${updatedFields.status}`,
            relatedId: order._id
          };
        }
      } else if (updatedFields.paymentMethod || updatedFields.paymentStatus === 'paid') {
        eventType = 'order_paid';
        isCritical = true;
        payload.paymentMethod = updatedFields.paymentMethod || order.paymentMethod;
        payload.amount = order.total;
        
        alertData = {
          type: 'success',
          title: 'Payment Received',
          message: `Payment of ₹${order.total} received for order #${order.orderNumber || order._id.toString().slice(-4)}`,
          relatedId: order._id
        };
      } else if (updatedFields.paymentStatus === 'refunded') {
        eventType = 'order_refunded';
        isCritical = true;
        payload.amount = order.total;
        
        alertData = {
          type: 'warning',
          title: 'Refund Processed',
          message: `Refund of ₹${order.total} for order #${order.orderNumber || order._id.toString().slice(-4)}`,
          relatedId: order._id
        };
      } else if (updatedFields.items) {
        eventType = 'order_items_updated';
        payload.items = order.items;
      } else if (updatedFields.table) {
        eventType = 'order_table_changed';
        payload.tableId = updatedFields.table;
        isCritical = true;
      } else {
        eventType = 'order_updated';
      }
      break;
      
    case 'delete':
      eventType = 'order_deleted';
      break;
  }

  if (eventType) {
    // Emit specific event
    io.to(room).emit(eventType, payload);
    console.log(`Emitted ${eventType} to ${room}`);

    // If critical, also emit critical_metric_update
    if (isCritical) {
      io.to(room).emit('critical_metric_update', {
        type: eventType,
        ...payload,
        priority: 'high'
      });
      console.log(`Emitted critical_metric_update to ${room}`);

      // Trigger immediate stats update for critical events
      sendStatsUpdate(branchId, io, true);
    } else {
      // For non-critical updates, use debounced stats update
      debouncedStatsUpdate(branchId, io);
    }
  }

  // Create and emit alert if applicable
  if (alertData) {
    try {
      const alert = await Alert.create({
        branch: branchId,
        ...alertData
      });
      
      io.to(room).emit('new_alert', alert);
      console.log(`Emitted new_alert to ${room}`);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
};

/**
 * Process and emit table changes
 * @param {Object} change - MongoDB Change Stream event
 * @param {Server} io - Socket.io Server instance
 */
const processTableChange = async (change, io) => {
  const table = change.fullDocument;
  
  if (!table || !table.branch) return;

  const branchId = table.branch.toString();
  const room = `branch_${branchId}`;
  
  let eventType = null;
  let payload = {
    tableId: table._id,
    tableNumber: table.tableNumber,
    timestamp: new Date()
  };

  switch (change.operationType) {
    case 'update':
      const updatedFields = change.updateDescription?.updatedFields;
      
      if (updatedFields && updatedFields.status) {
        eventType = 'table_occupancy_change';
        payload.previousStatus = change.updateDescription?.updatedFields?.status;
        payload.newStatus = table.status;
        payload.data = table;
        
        // Emit table status change
        io.to(room).emit(eventType, payload);
        console.log(`Emitted ${eventType} to ${room} (Table ${table.tableNumber}: ${table.status})`);

        // Critical event: Table status changed
        io.to(room).emit('critical_metric_update', {
          type: 'table_status_change',
          ...payload,
          priority: 'medium'
        });

        // Trigger immediate stats update
        sendStatsUpdate(branchId, io, true);
      }
      break;
      
    case 'insert':
      eventType = 'table_added';
      payload.data = table;
      io.to(room).emit(eventType, payload);
      debouncedStatsUpdate(branchId, io);
      break;
      
    case 'delete':
      eventType = 'table_removed';
      io.to(room).emit(eventType, payload);
      debouncedStatsUpdate(branchId, io);
      break;
  }
};

/**
 * Debounced stats update
 * @param {String} branchId - Branch ID
 * @param {Server} io - Socket.io instance
 */
const debouncedStatsUpdate = (branchId, io) => {
  const queue = updateQueues.get(branchId);
  
  if (!queue) {
    updateQueues.set(branchId, {
      lastUpdate: 0,
      pendingUpdate: null,
      timeout: null,
      interval: null
    });
  }

  const currentQueue = updateQueues.get(branchId);

  // Clear existing timeout
  if (currentQueue.timeout) {
    clearTimeout(currentQueue.timeout);
  }

  // Set new timeout
  currentQueue.timeout = setTimeout(() => {
    sendStatsUpdate(branchId, io, false);
    currentQueue.timeout = null;
  }, DEBOUNCE_DELAY);
};

/**
 * Emit custom event to branch room (for use in other modules)
 * @param {String} branchId - Branch ID
 * @param {String} eventType - Event type
 * @param {Object} payload - Event payload
 */
const emitToBranch = (branchId, eventType, payload) => {
  if (!global.io) {
    console.warn('Socket.io not initialized');
    return;
  }

  const room = `branch_${branchId}`;
  global.io.to(room).emit(eventType, {
    ...payload,
    timestamp: new Date()
  });
  console.log(`Emitted ${eventType} to ${room}`);
};

/**
 * Trigger immediate stats update for a branch (for use in other modules)
 * @param {String} branchId - Branch ID
 */
const triggerStatsUpdate = (branchId) => {
  if (!global.io) {
    console.warn('Socket.io not initialized');
    return;
  }

  sendStatsUpdate(branchId, global.io, true);
};

module.exports = { 
  initRealtime, 
  emitToBranch, 
  triggerStatsUpdate 
};
