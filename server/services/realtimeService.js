const mongoose = require('mongoose');
const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Table = require('../models/Table');
const Branch = require('../models/Branch');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
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
        eventType = 'payment_confirmation';
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

// ============================================
// SYSTEM ALERT GENERATION FUNCTIONS
// ============================================

/**
 * Create and emit a system-generated alert
 * @param {Object} alertConfig - Alert configuration
 * @returns {Promise<Object>} - Created alert
 */
const createSystemAlert = async (alertConfig) => {
  try {
    const {
      branch,
      type,
      severity = 'warning',
      title,
      message,
      metadata = {},
      relatedId = null,
      onModel = null,
      actionUrl = null
    } = alertConfig;

    const alert = await Alert.create({
      branch,
      type,
      category: 'system',
      severity,
      title,
      message,
      priority: severity === 'critical' ? 'critical' : 'high',
      isSystemGenerated: true,
      metadata,
      relatedId,
      onModel,
      actionUrl
    });

    // Emit to branch room
    emitToBranch(branch.toString(), 'new_alert', alert);

    console.log(`System alert created: ${type} (${severity}) for branch ${branch}`);
    return alert;
  } catch (error) {
    console.error('Error creating system alert:', error);
    return null;
  }
};

/**
 * Check for payment gateway failures
 * @param {String} branchId - Branch ID
 */
const checkPaymentFailures = async (branchId) => {
  try {
    // Find failed payments in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failedPayments = await Payment.countDocuments({
      branch: branchId,
      status: 'failed',
      createdAt: { $gte: oneHourAgo }
    });

    // Check if there's an active alert for this
    const existingAlert = await Alert.findOne({
      branch: branchId,
      type: 'payment_failure',
      isResolved: false,
      createdAt: { $gte: oneHourAgo }
    });

    if (failedPayments >= 3 && !existingAlert) {
      await createSystemAlert({
        branch: branchId,
        type: 'payment_failure',
        severity: 'critical',
        title: 'Payment Gateway Issues',
        message: `${failedPayments} payment failures detected in the last hour. Check payment gateway connection.`,
        metadata: {
          metric: 'failed_payments',
          value: failedPayments,
          threshold: 3,
          timeWindow: '1 hour'
        }
      });
    } else if (failedPayments === 0 && existingAlert) {
      // Resolve alert if payments are succeeding again
      existingAlert.isResolved = true;
      existingAlert.resolvedAt = new Date();
      await existingAlert.save();
    }
  } catch (error) {
    console.error('Error checking payment failures:', error);
  }
};

/**
 * Check for unusual revenue drop
 * @param {String} branchId - Branch ID
 */
const checkRevenueAnomaly = async (branchId) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get today's revenue
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          branch: mongoose.Types.ObjectId(branchId),
          paymentStatus: 'paid',
          createdAt: { $gte: today }
        }
      },
      {
        $group: { _id: null, total: { $sum: '$total' } }
      }
    ]);

    const todayTotal = todayRevenue[0]?.total || 0;

    // Get average daily revenue for last 7 days (excluding today)
    const weekRevenue = await Order.aggregate([
      {
        $match: {
          branch: mongoose.Types.ObjectId(branchId),
          paymentStatus: 'paid',
          createdAt: { $gte: lastWeek, $lt: today }
        }
      },
      {
        $group: { _id: null, total: { $sum: '$total' } }
      }
    ]);

    const weekTotal = weekRevenue[0]?.total || 0;
    const avgDailyRevenue = weekTotal / 7;
    const revenueDropPercent = ((avgDailyRevenue - todayTotal) / avgDailyRevenue) * 100;

    // Alert if revenue drop > 30%
    if (revenueDropPercent > 30) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'revenue_drop',
        isResolved: false,
        createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      });

      if (!existingAlert) {
        await createSystemAlert({
          branch: branchId,
          type: 'revenue_drop',
          severity: 'warning',
          title: 'Unusual Revenue Drop Detected',
          message: `Today's revenue (₹${todayTotal.toFixed(0)}) is ${revenueDropPercent.toFixed(1)}% below weekly average (₹${avgDailyRevenue.toFixed(0)}).`,
          metadata: {
            metric: 'daily_revenue',
            value: todayTotal,
            threshold: avgDailyRevenue,
            dropPercent: revenueDropPercent,
            weeklyAverage: avgDailyRevenue
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking revenue anomaly:', error);
  }
};

/**
 * Check for too many unpaid tables
 * @param {String} branchId - Branch ID
 */
const checkUnpaidTables = async (branchId) => {
  try {
    // Count tables with pending payments
    const unpaidTablesCount = await Table.countDocuments({
      branch: branchId,
      status: 'occupied',
      currentOrder: { $exists: true, $ne: null }
    });

    // Get total table count
    const totalTables = await Table.countDocuments({ branch: branchId });

    // Check for unpaid orders
    const unpaidOrders = await Order.countDocuments({
      branch: branchId,
      paymentStatus: 'pending',
      createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // Last 4 hours
    });

    // Alert if >50% tables occupied with pending payment
    const occupancyRatio = unpaidTablesCount / totalTables;

    if (unpaidOrders >= 5 && !existingAlert) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'unpaid_tables',
        isResolved: false
      });

      if (!existingAlert) {
        await createSystemAlert({
          branch: branchId,
          type: 'unpaid_tables',
          severity: occupancyRatio > 0.7 ? 'critical' : 'warning',
          title: unpaidOrders >= 10 ? 'Critical: Many Unpaid Orders' : 'Multiple Unpaid Tables',
          message: `${unpaidOrders} orders with pending payment. ${unpaidTablesCount} of ${totalTables} tables occupied.`,
          metadata: {
            metric: 'unpaid_orders',
            value: unpaidOrders,
            occupiedTables: unpaidTablesCount,
            totalTables: totalTables,
            occupancyRatio: occupancyRatio,
            threshold: 5
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking unpaid tables:', error);
  }
};

/**
 * Check for inventory stock-out risk
 * @param {String} branchId - Branch ID
 */
const checkInventoryStockOut = async (branchId) => {
  try {
    const MenuItem = require('../models/MenuItem');

    // Find items with low or zero stock
    const lowStockItems = await MenuItem.find({
      branch: branchId,
      stock: { $lte: 5 },
      isAvailable: true
    }).select('name stock');

    const outOfStockItems = await MenuItem.find({
      branch: branchId,
      stock: 0,
      isAvailable: true
    }).select('name');

    if (outOfStockItems.length > 0) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'inventory_stockout',
        isResolved: false
      });

      if (!existingAlert) {
        const itemNames = outOfStockItems.map(i => i.name).join(', ');
        await createSystemAlert({
          branch: branchId,
          type: 'inventory_stockout',
          severity: 'critical',
          title: 'Out of Stock Items',
          message: `Items out of stock: ${itemNames}. Please reorder immediately.`,
          metadata: {
            metric: 'out_of_stock',
            value: outOfStockItems.length,
            affectedItems: outOfStockItems.map(i => i._id)
          }
        });
      }
    } else if (lowStockItems.length > 0) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'inventory_stockout',
        isResolved: false
      });

      if (!existingAlert) {
        const itemNames = lowStockItems.map(i => `${i.name} (${i.stock})`).join(', ');
        await createSystemAlert({
          branch: branchId,
          type: 'inventory_stockout',
          severity: 'warning',
          title: 'Low Stock Warning',
          message: `Items running low: ${itemNames}. Consider reordering soon.`,
          metadata: {
            metric: 'low_stock',
            value: lowStockItems.length,
            affectedItems: lowStockItems.map(i => i._id)
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking inventory stock:', error);
  }
};

/**
 * Check for repeated order edits (abuse detection)
 * @param {String} branchId - Branch ID
 * @param {String} orderId - Order ID
 */
const checkOrderEditAbuse = async (branchId, orderId) => {
  try {
    const ONE_HOUR = 60 * 60 * 1000;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR);

    const order = await Order.findById(orderId);
    if (!order) return;

    // Count edit operations in last hour
    const editCount = order.editHistory?.filter(edit => 
      new Date(edit.timestamp) > oneHourAgo
    ).length || 0;

    // Alert if more than 5 edits in 1 hour
    if (editCount > 5) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'order_edit_abuse',
        isResolved: false,
        'metadata.affectedRecords': orderId
      });

      if (!existingAlert) {
        await createSystemAlert({
          branch: branchId,
          type: 'order_edit_abuse',
          severity: 'warning',
          title: 'Repeated Order Edits Detected',
          message: `Order #${order.orderNumber || orderId.toString().slice(-4)} has been edited ${editCount} times in the last hour.`,
          metadata: {
            metric: 'order_edits',
            value: editCount,
            threshold: 5,
            affectedRecords: [orderId],
            timeWindow: '1 hour'
          },
          relatedId: orderId,
          onModel: 'Order',
          actionUrl: `/orders/${orderId}`
        });
      }
    }
  } catch (error) {
    console.error('Error checking order edit abuse:', error);
  }
};

/**
 * Check for excessive manual table releases
 * @param {String} branchId - Branch ID
 */
const checkTableReleaseAbuse = async (branchId) => {
  try {
    const ONE_HOUR = 60 * 60 * 1000;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR);

    const Table = require('../models/Table');
    
    // Get tables with multiple manual releases
    const tables = await Table.find({
      branch: branchId
    }).select('tableNumber releaseHistory');

    let abusiveReleases = 0;
    let affectedTables = [];

    tables.forEach(table => {
      const recentReleases = table.releaseHistory?.filter(release =>
        release.isManual && new Date(release.timestamp) > oneHourAgo
      ).length || 0;

      if (recentReleases > 3) {
        abusiveReleases += recentReleases;
        affectedTables.push(table.tableNumber);
      }
    });

    if (abusiveReleases > 5) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'table_release_abuse',
        isResolved: false,
        createdAt: { $gte: oneHourAgo }
      });

      if (!existingAlert) {
        await createSystemAlert({
          branch: branchId,
          type: 'table_release_abuse',
          severity: 'warning',
          title: 'Excessive Manual Table Releases',
          message: `Tables ${affectedTables.join(', ')} have been manually released ${abusiveReleases} times in the last hour.`,
          metadata: {
            metric: 'manual_releases',
            value: abusiveReleases,
            threshold: 5,
            affectedTables: affectedTables,
            timeWindow: '1 hour'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking table release abuse:', error);
  }
};

/**
 * Check for coupon abuse detection
 * @param {String} branchId - Branch ID
 */
const checkCouponAbuse = async (branchId) => {
  try {
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR);
    const oneDayAgo = new Date(Date.now() - ONE_DAY);

    // Check for excessive coupon usage in last hour
    const couponOrders = await Order.aggregate([
      {
        $match: {
          branch: mongoose.Types.ObjectId(branchId),
          couponApplied: true,
          createdAt: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: '$appliedCoupon',
          count: { $sum: 1 },
          totalDiscount: { $sum: '$couponDiscount' }
        }
      },
      {
        $match: { count: { $gte: 10 } }
      }
    ]);

    if (couponOrders.length > 0) {
      const existingAlert = await Alert.findOne({
        branch: branchId,
        type: 'coupon_abuse',
        isResolved: false,
        createdAt: { $gte: oneHourAgo }
      });

      if (!existingAlert) {
        const totalDiscounts = couponOrders.reduce((sum, c) => sum + c.totalDiscount, 0);
        const totalUsage = couponOrders.reduce((sum, c) => sum + c.count, 0);

        await createSystemAlert({
          branch: branchId,
          type: 'coupon_abuse',
          severity: totalUsage > 20 ? 'critical' : 'warning',
          title: totalUsage > 20 ? 'Critical: Coupon Abuse Detected' : 'Unusual Coupon Usage Pattern',
          message: `${totalUsage} coupon applications in the last hour with ₹${totalDiscounts.toFixed(0)} total discount. Possible abuse detected.`,
          metadata: {
            metric: 'coupon_usage',
            value: totalUsage,
            totalDiscount: totalDiscounts,
            threshold: 10,
            affectedCoupons: couponOrders.map(c => c._id),
            timeWindow: '1 hour'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking coupon abuse:', error);
  }
};

/**
 * Run all system alert checks for a branch
 * @param {String} branchId - Branch ID
 */
const runAllSystemChecks = async (branchId) => {
  try {
    await Promise.all([
      checkPaymentFailures(branchId),
      checkRevenueAnomaly(branchId),
      checkUnpaidTables(branchId),
      checkInventoryStockOut(branchId),
      checkTableReleaseAbuse(branchId),
      checkCouponAbuse(branchId)
    ]);
  } catch (error) {
    console.error('Error running system checks:', error);
  }
};

/**
 * Schedule periodic system alert checks
 * @param {String} branchId - Branch ID
 */
const scheduleSystemChecks = (branchId) => {
  // Run checks every 5 minutes
  setInterval(() => {
    runAllSystemChecks(branchId);
  }, 5 * 60 * 1000);
};

module.exports = {
  initRealtime,
  emitToBranch,
  triggerStatsUpdate,
  // Alert generation functions
  createSystemAlert,
  checkPaymentFailures,
  checkRevenueAnomaly,
  checkUnpaidTables,
  checkInventoryStockOut,
  checkOrderEditAbuse,
  checkTableReleaseAbuse,
  checkCouponAbuse,
  runAllSystemChecks,
  scheduleSystemChecks
};
