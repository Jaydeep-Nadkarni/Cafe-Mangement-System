const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const Admin = require('../models/Admin');
const Alert = require('../models/Alert');
const Memo = require('../models/Memo');
const CustomerPreferences = require('../models/CustomerPreferences');
const orderService = require('../services/orderService');
const billService = require('../services/billService');
const whatsappService = require('../services/whatsappService');
const auditService = require('../services/auditService');
const { triggerStatsUpdate, emitToBranch } = require('../services/realtimeService');
const { applyStatsDelta } = require('../services/analyticsService');

// Order lifecycle: CREATED → CONFIRMED → PREPARING → READY → PAID → CLOSED
const STATUS_FLOW = {
  created: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'paid',
  paid: 'closed',
  closed: null // Terminal state
};

/**
 * Validate status transition
 * @param {String} currentStatus - Current order status
 * @param {String} newStatus - Desired new status
 * @returns {Object} { valid: Boolean, message: String }
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  // Allow cancellation from any non-terminal state
  if (newStatus === 'cancelled' && !['paid', 'closed', 'cancelled'].includes(currentStatus)) {
    return { valid: true };
  }

  // Check if already in terminal state
  if (['closed', 'cancelled'].includes(currentStatus)) {
    return {
      valid: false,
      message: `Cannot change status from ${currentStatus}`
    };
  }

  // Check if trying to skip ahead
  const expectedNext = STATUS_FLOW[currentStatus];
  if (newStatus !== expectedNext) {
    return {
      valid: false,
      message: `Invalid transition: ${currentStatus} → ${newStatus}. Expected: ${currentStatus} → ${expectedNext}`
    };
  }

  return { valid: true };
};

/**
 * Validate order for modifications (items, prices, etc.)
 * @param {Object} order - Order document
 * @returns {Object} { valid: Boolean, message: String }
 */
const validateOrderForModification = (order) => {
  if (!order) {
    return { valid: false, message: 'Order not found' };
  }

  if (['paid', 'closed', 'cancelled'].includes(order.status)) {
    return {
      valid: false,
      message: `Cannot modify ${order.status} order`
    };
  }

  return { valid: true };
};

/**
 * Validate orders can be merged
 * @param {Array} orders - Array of order documents
 * @returns {Object} { valid: Boolean, message: String }
 */
const validateOrdersForMerge = (orders) => {
  if (!orders || orders.length < 2) {
    return { valid: false, message: 'At least 2 orders required to merge' };
  }

  // All orders must be unpaid
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  if (paidOrders.length > 0) {
    return {
      valid: false,
      message: 'Cannot merge paid orders. All orders must be unpaid.'
    };
  }

  // All orders must have valid statuses
  const validStatuses = ['created', 'confirmed', 'preparing', 'ready'];
  const invalidOrders = orders.filter(o => !validStatuses.includes(o.status));
  if (invalidOrders.length > 0) {
    return {
      valid: false,
      message: `Can only merge orders with status: ${validStatuses.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Validate order for deletion
 * @param {Object} order - Order document
 * @returns {Object} { valid: Boolean, message: String, requiresApproval: Boolean }
 */
const validateOrderForDeletion = (order) => {
  if (!order) {
    return { valid: false, message: 'Order not found' };
  }

  // Cannot delete closed/paid orders without refund setup
  if (order.status === 'paid' && order.paymentStatus === 'paid') {
    return {
      valid: false,
      message: 'Cannot delete paid orders. Issue refund first.',
      requiresApproval: true
    };
  }

  // Flag for approval if high-value order
  const requiresApproval = order.total > 5000;

  return { valid: true, requiresApproval };
};

/**
 * Log order edit to editHistory
 * @param {Object} order - Order document
 * @param {String} changeType - Type of change
 * @param {String} fieldChanged - Field that was changed
 * @param {*} beforeValue - Previous value
 * @param {*} afterValue - New value
 * @param {Object} context - { editedBy, editedByName, editedByRole, reason }
 */
const recordOrderEdit = (order, changeType, fieldChanged, beforeValue, afterValue, context) => {
  if (!order.editHistory) {
    order.editHistory = [];
  }

  order.editHistory.push({
    editedAt: new Date(),
    editedBy: context.editedBy,
    editedByName: context.editedByName,
    editedByRole: context.editedByRole,
    changeType,
    fieldChanged,
    beforeValue,
    afterValue,
    reason: context.reason || null
  });

  // Keep only last 100 edits to prevent unbounded growth
  if (order.editHistory.length > 100) {
    order.editHistory = order.editHistory.slice(-100);
  }
};

/**
 * Log order merge to mergeHistory
 * @param {Object} order - Order document
 * @param {Array} mergedOrderIds - IDs of merged orders
 * @param {Object} context - { mergedBy, mergedByName, mergedByRole, reason }
 */
const recordOrderMerge = (order, mergedOrderIds, itemCountBefore, itemCountAfter, amountBefore, amountAfter, context) => {
  if (!order.mergeHistory) {
    order.mergeHistory = [];
  }

  order.mergeHistory.push({
    mergedAt: new Date(),
    mergedBy: context.mergedBy,
    mergedByName: context.mergedByName,
    mergedWithOrderIds: mergedOrderIds,
    itemCountBefore,
    itemCountAfter,
    amountBefore,
    amountAfter,
    reason: context.reason || null
  });
};

/**
 * Helper to update table session statistics
 * @param {String} tableId 
 */
const updateTableSessionStats = async (tableId) => {
  try {
    const table = await Table.findById(tableId).populate('currentOrders');
    if (!table) return;

    if (!table.currentOrders || table.currentOrders.length === 0) {
      table.sessionStats = {
        totalOrders: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0
      };
      if (table.status === 'available') {
        table.sessionStart = null;
      }
    } else {
      // If just starting a session
      if (!table.sessionStart) {
        table.sessionStart = new Date();
      }

      const stats = table.currentOrders.reduce((acc, order) => {
        // Skip cancelled orders in stats calculation
        if (order.status === 'cancelled') return acc;

        acc.totalOrders += 1;
        acc.totalAmount += (order.total || 0);

        if (order.paymentStatus === 'paid') {
          acc.paidAmount += (order.total || 0);
        } else {
          acc.unpaidAmount += (order.total || 0);
        }
        return acc;
      }, { totalOrders: 0, totalAmount: 0, paidAmount: 0, unpaidAmount: 0 });

      table.sessionStats = stats;
    }

    await table.save();
  } catch (error) {
    console.error('Error updating table session stats:', error);
  }
};

/**
 * Helper function to update customer loyalty stats
 * Called when order is paid
 * @param {String} customerPhone - Customer phone number
 * @param {Number} orderTotal - Total amount paid
 */
const updateCustomerLoyaltyStats = async (customerPhone, orderTotal) => {
  try {
    if (!customerPhone) return;

    let customer = await CustomerPreferences.findOne({ phone: customerPhone });

    if (!customer) {
      customer = await CustomerPreferences.create({
        phone: customerPhone,
        totalOrderAmount: orderTotal,
        totalOrders: 1,
        lastOrderDate: new Date(),
        loyaltyPoints: Math.floor(orderTotal / 100) // 1 point per ₹100 spent
      });
    } else {
      // Update customer stats
      customer.totalOrderAmount += orderTotal;
      customer.totalOrders += 1;
      customer.lastOrderDate = new Date();
      
      // Calculate and add loyalty points: 1 point per ₹100 spent
      const newPoints = Math.floor(orderTotal / 100);
      customer.loyaltyPoints += newPoints;

      // Update stats object for backward compatibility
      if (customer.stats) {
        customer.stats.totalOrders = customer.totalOrders;
        customer.stats.totalSpent = customer.totalOrderAmount;
        customer.stats.lastOrderDate = customer.lastOrderDate;
      }

      await customer.save();
    }

    console.log(`Updated customer ${customerPhone}: +${Math.floor(orderTotal / 100)} loyalty points`);
  } catch (error) {
    console.error('Error updating customer loyalty stats:', error);
    // Non-critical error - don't break order flow
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Manager
const createOrder = async (req, res) => {
  try {
    const { 
      tableId, 
      items, 
      customerCount, 
      chefNotes, 
      sessionPerson, 
      orderType = 'pay_later',
      customerPhone,
      customerName,
      taxNumber
    } = req.body;

    // Verify table belongs to manager's branch
    const table = await Table.findById(tableId).populate('branch');
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.branch.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this branch' });
    }

    // Calculate totals for new items
    const calculation = await orderService.calculateOrderTotals(items);

    let savedOrder;
    let isMerge = false;

    // PAY_LATER: Always merge into active session order for same table
    if (orderType === 'pay_later') {
      // Check for existing unpaid order in active session (includes QR orders)
      // Note: QR orders may not have orderType set, so we check for both
      let existingOrder = await Order.findOne({
        table: tableId,
        status: { $nin: ['closed', 'cancelled'] },
        paymentStatus: 'unpaid',
        $or: [
          { orderType: 'pay_later' },
          { orderType: { $exists: false } },  // Old orders without orderType
          { orderType: null }
        ]
      }).sort({ createdAt: -1 });  // Get most recent active order

      if (existingOrder) {
        // MERGE into existing order
        isMerge = true;

        // Combine items
        const newItems = [...existingOrder.items, ...calculation.items];

        existingOrder.items = newItems;
        existingOrder.subtotal += calculation.subtotal;
        existingOrder.tax += calculation.tax;
        existingOrder.total += calculation.total;
        existingOrder.sessionPerson = sessionPerson || existingOrder.sessionPerson;
        existingOrder.customerPhone = customerPhone || existingOrder.customerPhone;
        existingOrder.customerName = customerName || existingOrder.customerName;
        existingOrder.taxNumber = taxNumber || existingOrder.taxNumber;

        savedOrder = await existingOrder.save();

        // Emit update event
        emitToBranch(table.branch._id, 'order_updated', {
          orderId: savedOrder._id,
          orderNumber: savedOrder.orderNumber,
          table: table.tableNumber,
          total: savedOrder.total,
          items: savedOrder.items
        });

      } else {
        // Create NEW Order for pay_later - first order in new session
        const sessionId = `${tableId}-${Date.now()}`;
        const order = new Order({
          branch: table.branch._id,
          table: tableId,
          items: calculation.items,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
          status: 'created',
          customerCount: customerCount || 1,
          chefNotes: chefNotes || '',
          sessionId: sessionId,
          sessionPerson: sessionPerson || 'Table Order',
          orderType: 'pay_later',
          customerPhone,
          customerName,
          taxNumber
        });

        savedOrder = await order.save();

        // Add to currentOrders array
        if (!table.currentOrders) {
          table.currentOrders = [];
        }
        table.currentOrders.push(savedOrder._id);
        table.status = 'occupied';

        // Initialize session if needed
        if (!table.sessionStart && table.currentOrders.length === 1) {
          table.sessionStart = new Date();
        }

        await table.save();

        // Real-time broadcast
        emitToBranch(table.branch._id, 'new_order', {
          orderId: savedOrder._id,
          orderNumber: savedOrder.orderNumber,
          table: table.tableNumber,
          status: savedOrder.status,
          total: savedOrder.total,
          createdAt: savedOrder.createdAt
        });
      }
    } 
    // PAY_NOW: Check if same session/person before merging
    else if (orderType === 'pay_now') {
      let existingOrder = null;

      // Check for unpaid pay_now orders from same session/person
      if (sessionPerson) {
        existingOrder = await Order.findOne({
          table: tableId,
          sessionPerson: sessionPerson,
          status: { $nin: ['closed', 'cancelled'] },
          paymentStatus: 'unpaid',
          orderType: 'pay_now'
        });
      }

      if (existingOrder) {
        // MERGE: Same session and same person
        isMerge = true;

        const newItems = [...existingOrder.items, ...calculation.items];

        existingOrder.items = newItems;
        existingOrder.subtotal += calculation.subtotal;
        existingOrder.tax += calculation.tax;
        existingOrder.total += calculation.total;

        savedOrder = await existingOrder.save();

        emitToBranch(table.branch._id, 'order_updated', {
          orderId: savedOrder._id,
          orderNumber: savedOrder.orderNumber,
          table: table.tableNumber,
          total: savedOrder.total,
          items: savedOrder.items
        });

      } else {
        // CREATE separate order: Different person or first order
        // Check if there's an active session on this table to inherit sessionId
        const activeSession = await Order.findOne({
          table: tableId,
          status: { $nin: ['closed', 'cancelled'] },
          paymentStatus: 'unpaid'
        }).sort({ createdAt: -1 });
        
        const sessionId = activeSession?.sessionId || `${tableId}-${Date.now()}`;
        
        const order = new Order({
          branch: table.branch._id,
          table: tableId,
          items: calculation.items,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          total: calculation.total,
          status: 'created',
          customerCount: customerCount || 1,
          chefNotes: chefNotes || '',
          sessionId: sessionId,
          sessionPerson: sessionPerson || 'Guest',
          orderType: 'pay_now'
        });

        savedOrder = await order.save();

        // Add to currentOrders array
        if (!table.currentOrders) {
          table.currentOrders = [];
        }
        table.currentOrders.push(savedOrder._id);
        table.status = 'occupied';

        // Initialize session if needed
        if (!table.sessionStart && table.currentOrders.length === 1) {
          table.sessionStart = new Date();
        }

        await table.save();

        // Real-time broadcast
        emitToBranch(table.branch._id, 'new_order', {
          orderId: savedOrder._id,
          orderNumber: savedOrder.orderNumber,
          table: table.tableNumber,
          status: savedOrder.status,
          total: savedOrder.total,
          createdAt: savedOrder.createdAt
        });
      }
    }

    // Update session stats
    await updateTableSessionStats(table._id);

    // Apply incremental stats delta (revenue=0 since unpaid initially)
    const totalItems = calculation.items.reduce((sum, item) => sum + item.quantity, 0);
    await applyStatsDelta(table.branch._id, {
      revenue: 0,
      orders: 1,
      items: totalItems
    });

    // Emit socket event for new order
    emitToBranch(table.branch._id, 'new_order', {
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      table: tableId,
      status: savedOrder.status,
      total: savedOrder.total
    });

    // Trigger stats update
    triggerStatsUpdate(table.branch._id);

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order details
// @route   GET /api/orders/:id
// @access  Manager
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem')
      .populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add items to order
// @route   PUT /api/orders/:id/items
// @access  Manager
const addItemsToOrder = async (req, res) => {
  try {
    const { items } = req.body; // Array of { menuItemId, quantity, notes }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['paid', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot modify closed order' });
    }

    // Merge new items with existing items
    // We need to reconstruct the items array for calculation
    const currentItems = order.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.notes
    }));

    const prevTotal = order.total || 0;

    const allItems = [...currentItems, ...items];

    // Recalculate everything
    const calculation = await orderService.calculateOrderTotals(allItems, order.coupon);

    order.items = calculation.items;
    order.subtotal = calculation.subtotal;
    order.tax = calculation.tax;
    order.discount = calculation.discount;
    order.total = calculation.total;

    await order.save();

    // Update table session stats
    if (order.table) {
      await updateTableSessionStats(order.table);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply coupon
// @route   PUT /api/orders/:id/coupon
// @access  Manager
const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Reconstruct items for calculation
    const currentItems = order.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.notes
    }));

    try {
      const calculation = await orderService.calculateOrderTotals(currentItems, code);

      order.items = calculation.items;
      order.subtotal = calculation.subtotal;
      order.tax = calculation.tax;
      order.discount = calculation.discount;
      order.total = calculation.total;
      order.coupon = calculation.couponCode; // Store the code if valid

      await order.save();

      // Update table session stats
      if (order.table) {
        await updateTableSessionStats(order.table);
      }

      res.json(order);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Checkout/Complete order
// @route   POST /api/orders/:id/checkout
// @access  Manager
const checkoutOrder = async (req, res) => {
  try {
    const { paymentMethod, amountPaid, isSplit, splitType, splitPayments } = req.body;
    
    // Validate input
    if (!paymentMethod || (!isSplit && !amountPaid && amountPaid !== 0)) {
      return res.status(400).json({ message: 'Payment method and amount are required' });
    }

    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already in terminal state
    if (['paid', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order is already ' + order.status });
    }

    // Validate payment before allowing PAID status
    const totalPaid = isSplit ? splitPayments.reduce((sum, p) => sum + p.amount, 0) : amountPaid;
    if (totalPaid < order.total) {
      return res.status(400).json({ 
        message: `Insufficient payment amount. Required: ₹${order.total.toFixed(2)}, Paid: ₹${totalPaid.toFixed(2)}` 
      });
    }

    // Validate payment method is supported
    const validPaymentMethods = ['cash', 'card', 'upi', 'wallet', 'online', 'mixed'];
    if (!validPaymentMethods.includes(isSplit ? 'mixed' : paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Create Payment record
    const Payment = require('../models/Payment');
    const payment = new Payment({
      order: order._id,
      branch: order.branch,
      amount: order.total,
      paymentMethod: isSplit ? 'mixed' : paymentMethod,
      isSplit: isSplit || false,
      splitType: splitType || null,
      splitPayments: splitPayments || [],
      status: 'completed',
      completedAt: new Date()
    });
    await payment.save();

    // Update order with payment details
    order.paymentMethod = isSplit ? 'mixed' : paymentMethod;
    order.paymentStatus = 'paid';
    order.paidAt = new Date(); // Use new Date() instead of Date.now() for consistency
    order.status = 'paid';

    await order.save();

    // Update customer loyalty stats (1 point per ₹100 spent)
    if (order.customerPhone) {
      await updateCustomerLoyaltyStats(order.customerPhone, order.total);
    }

    // TABLE STATUS UPDATE: Ensure table becomes available after payment completion
    if (order.table) {
      const table = await Table.findById(order.table);
      if (table) {
        // If paymentMethod is cash, we close the whole session (legacy behavior)
        if (paymentMethod === 'cash') {
          const sessionOrders = await Order.find({
            table: order.table._id || order.table,
            paymentStatus: 'unpaid',
            status: { $nin: ['closed', 'cancelled'] }
          });
          
          for (const sessionOrder of sessionOrders) {
            sessionOrder.paymentMethod = paymentMethod;
            sessionOrder.paymentStatus = 'paid';
            sessionOrder.paidAt = new Date(); // Use new Date() for consistency
            sessionOrder.status = 'paid';
            await sessionOrder.save();

            if (sessionOrder.customerPhone) {
              await updateCustomerLoyaltyStats(sessionOrder.customerPhone, sessionOrder.total);
            }
          }
          
          table.currentOrders = [];
          table.status = 'available';
          table.sessionStart = null;
        } else {
          // For other payment methods, remove this order from currentOrders
          table.currentOrders = table.currentOrders.filter(
            id => id.toString() !== order._id.toString()
          );
          
          // If no more orders left in the session, set table to available
          if (table.currentOrders.length === 0) {
            table.status = 'available';
            table.sessionStart = null;
          }
        }

        await table.save();
        await updateTableSessionStats(table._id);
      }
    }

    // Apply incremental stats delta
    await applyStatsDelta(order.branch, {
      revenue: order.total,
      orders: 1,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0)
    });

    // Emit socket event for payment
    emitToBranch(order.branch, 'payment_confirmation', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?.tableNumber,
      paymentMethod,
      total: order.total
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Checkout entire table session (all unpaid orders)
// @route   POST /api/orders/session-checkout/:tableId
// @access  Manager
const sessionCheckout = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { paymentMethod } = req.body;
    
    const table = await Table.findById(tableId).populate('branch');
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Verify authorization
    if (table.branch.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this branch' });
    }
    
    // Find all unpaid orders for this table
    const unpaidOrders = await Order.find({
      table: tableId,
      paymentStatus: 'unpaid',
      status: { $nin: ['closed', 'cancelled'] }
    });
    
    if (unpaidOrders.length === 0) {
      return res.status(400).json({ message: 'No unpaid orders found for this table' });
    }
    
    // Calculate total
    const sessionTotal = unpaidOrders.reduce((sum, order) => sum + order.total, 0);
    let totalItems = 0;
    
    // Mark all orders as paid
    for (const order of unpaidOrders) {
      order.paymentMethod = paymentMethod;
      order.paymentStatus = 'paid';
      order.paidAt = new Date(); // Use new Date() for consistency
      order.status = 'paid';
      await order.save();
      
      // Update customer loyalty stats for each order
      if (order.customerPhone) {
        await updateCustomerLoyaltyStats(order.customerPhone, order.total);
      }
      
      totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    // SESSION CLOSURE - Table becomes available after full session payment
    table.currentOrders = [];
    table.status = 'available';
    table.sessionStart = null;
    await table.save();
    
    // Update session stats
    await updateTableSessionStats(tableId);
    
    // Apply incremental stats delta
    await applyStatsDelta(table.branch._id, {
      revenue: sessionTotal,
      orders: unpaidOrders.length,
      items: totalItems
    });
    
    // Emit socket event
    emitToBranch(table.branch._id, 'session_closed', {
      tableId: table._id,
      tableNumber: table.tableNumber,
      ordersCount: unpaidOrders.length,
      total: sessionTotal,
      paymentMethod
    });
    
    // Trigger stats update
    triggerStatsUpdate(table.branch._id);
    
    console.log(`[Session Checkout] Table ${table.tableNumber}: ${unpaidOrders.length} orders, Total: ${sessionTotal}`);
    
    res.json({
      success: true,
      tableNumber: table.tableNumber,
      ordersCount: unpaidOrders.length,
      total: sessionTotal,
      paymentMethod
    });
  } catch (error) {
    console.error('[Session Checkout Error]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send bill via WhatsApp
// @route   POST /api/orders/:id/send-whatsapp-bill
// @access  Manager
const sendWhatsappBill = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem')
      .populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Generate PDF
    const pdfBuffer = await billService.generateThermalBill(order);

    // Send via WhatsApp
    const result = await whatsappService.sendWhatsappBill(phoneNumber, pdfBuffer, `Bill-${order._id}.pdf`);

    if (result.success) {
      res.json({ message: 'Bill sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send bill', error: result.error });
    }
  } catch (error) {
    console.error('Send Bill Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from order
// @route   DELETE /api/orders/:id/items/:itemId
// @access  Manager
const removeItemFromOrder = async (req, res) => {
  try {
    const { itemId } = req.params;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['paid', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot modify closed order' });
    }

    // Filter out the item
    const initialLength = order.items.length;
    const prevTotal = order.total || 0;
    const prevItemsCount = order.items.reduce((s, it) => s + it.quantity, 0);

    order.items = order.items.filter(item => item._id.toString() !== itemId);

    if (order.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    // Reconstruct items for calculation
    const currentItems = order.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.specialInstructions
    }));

    // Recalculate
    const calculation = await orderService.calculateOrderTotals(currentItems, order.coupon);

    order.items = calculation.items;
    order.subtotal = calculation.subtotal;
    order.tax = calculation.tax;
    order.discount = calculation.discount;
    order.total = calculation.total;

    await order.save();

    // Apply incremental stats delta
    const newTotalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const deltaItems = newTotalItems - prevItemsCount;
    const deltaRevenue = order.total - prevTotal;

    if (deltaItems !== 0 || deltaRevenue !== 0) {
      await applyStatsDelta(order.branch, {
        revenue: deltaRevenue,
        orders: 0,
        items: deltaItems
      });
    }

    // Update table session stats
    if (order.table) {
      await updateTableSessionStats(order.table);
    }

    // Emit order items updated event and trigger immediate stats update
    emitToBranch(order.branch, 'order_items_updated', {
      orderId: order._id,
      items: order.items,
      total: order.total
    });

    triggerStatsUpdate(order.branch);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update item quantity in order
// @route   PUT /api/orders/:id/items/:itemId
// @access  Manager
const updateItemQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['paid', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot modify closed order' });
    }

    const item = order.items.find(it => it._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    const prevQty = item.quantity;
    const prevTotal = order.total;
    const prevItemsCount = order.items.reduce((s, it) => s + it.quantity, 0);

    if (newQty === 0) {
      // Remove the item
      order.items = order.items.filter(it => it._id.toString() !== itemId);
    } else {
      // Update quantity
      item.quantity = newQty;
    }

    // Reconstruct items for calculation
    const currentItems = order.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.specialInstructions
    }));

    // Recalculate
    const calculation = await orderService.calculateOrderTotals(currentItems, order.coupon);

    order.items = calculation.items;
    order.subtotal = calculation.subtotal;
    order.tax = calculation.tax;
    order.discount = calculation.discount;
    order.total = calculation.total;

    await order.save();

    // Update table session stats
    if (order.table) {
      await updateTableSessionStats(order.table);
    }

    // Apply incremental stats delta
    const newTotalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const deltaItems = newTotalItems - prevItemsCount;
    const deltaRevenue = order.total - prevTotal;

    if (deltaItems !== 0 || deltaRevenue !== 0) {
      await applyStatsDelta(order.branch, {
        revenue: deltaRevenue,
        orders: 0,
        items: deltaItems
      });
    }

    // Emit order items updated event and trigger immediate stats update
    emitToBranch(order.branch, 'order_items_updated', {
      orderId: order._id,
      items: order.items,
      total: order.total
    });

    triggerStatsUpdate(order.branch);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Manager
const cancelOrder = async (req, res) => {
  const { password, reason } = req.body;

  try {
    // Verify password
    const user = await Admin.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Cannot cancel terminal states
    if (['paid', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel ${order.status} order` });
    }

    const previousStatus = order.status;
    const wasPaid = order.status === 'paid';
    
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = req.user._id;
    
    await order.save();

    // Apply incremental stats delta for cancellation
    // If order was paid, need to apply refund delta
    if (wasPaid) {
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await applyStatsDelta(order.branch, {
        revenue: -order.total,
        orders: 0,
        items: -totalItems
      });
    } else {
      // If unpaid, just decrement order count
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await applyStatsDelta(order.branch, {
        revenue: 0,
        orders: -1,
        items: -totalItems
      });
    }

    // Remove from table's currentOrders array
    const table = await Table.findById(order.table);
    if (table) {
      table.currentOrders = table.currentOrders.filter(
        orderId => orderId.toString() !== order._id.toString()
      );
      // Set status to available only if no more orders
      if (table.currentOrders.length === 0) {
        table.status = 'available';
      }
      await table.save();

      // Update session stats
      await updateTableSessionStats(table._id);
    }

    // Emit socket event (emit refund event if order was paid)
    if (wasPaid) {
      emitToBranch(order.branch, 'order_refunded', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.total,
        timestamp: new Date()
      });
    }

    emitToBranch(order.branch, 'order_status_change', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?.tableNumber,
      status: 'cancelled',
      previousStatus,
      timestamp: new Date()
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get merge preview (calculate combined order without executing)
// @route   POST /api/orders/merge/preview
// @access  Manager
const getMergePreview = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 order IDs required' });
    }

    // Fetch all orders
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('table')
      .populate('items.menuItem');

    if (orders.length !== orderIds.length) {
      return res.status(404).json({ message: 'One or more orders not found' });
    }

    // Validation: All orders must be from the same table
    const tableIds = orders.map(o => o.table?._id?.toString()).filter(Boolean);
    const uniqueTables = [...new Set(tableIds)];

    // Allow merging from different tables (Multi-table merge)
    // if (uniqueTables.length > 1) {
    //   return res.status(400).json({ 
    //     message: 'Cannot merge orders from different tables',
    //     validation: { valid: false, reason: 'different_tables' }
    //   });
    // }

    // Validation: All orders must be unpaid
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    if (paidOrders.length > 0) {
      return res.status(400).json({
        message: 'Cannot merge paid orders',
        validation: { valid: false, reason: 'has_paid_orders', paidOrderIds: paidOrders.map(o => o._id) }
      });
    }

    // Validation: Orders must be active/pending
    const invalidStatus = orders.filter(o => !['active', 'pending'].includes(o.status));
    if (invalidStatus.length > 0) {
      return res.status(400).json({
        message: 'Can only merge active or pending orders',
        validation: { valid: false, reason: 'invalid_status' }
      });
    }

    // Combine all items
    const combinedItems = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem._id.toString();
        if (combinedItems[itemId]) {
          combinedItems[itemId].quantity += item.quantity;
        } else {
          combinedItems[itemId] = {
            menuItem: item.menuItem,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions || ''
          };
        }
      });
    });

    const itemsArray = Object.values(combinedItems);

    // Calculate totals
    const subtotal = itemsArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    // Build preview response
    const preview = {
      validation: { valid: true },
      orderCount: orders.length,
      orders: orders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        total: o.total,
        itemCount: o.items.length
      })),
      combined: {
        items: itemsArray,
        subtotal,
        tax,
        total,
        itemCount: itemsArray.length,
        totalQuantity: itemsArray.reduce((sum, item) => sum + item.quantity, 0)
      },
      table: orders[0].table
    };

    res.json(preview);
  } catch (error) {
    console.error('Merge preview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Merge multiple orders with transactions and audit logs
// @route   POST /api/orders/merge
// @access  Manager
const mergeOrders = async (req, res) => {
  const session = await Order.startSession();

  try {
    await session.startTransaction();

    const { orderIds, reason } = req.body;
    const userId = req.user?._id;
    const userName = req.user?.name || 'System';
    const userRole = req.user?.role || 'admin';

    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length < 2) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'At least 2 order IDs required for merge' });
    }

    // Fetch all orders with session
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('table')
      .session(session);

    if (orders.length !== orderIds.length) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'One or more orders not found' });
    }

    // Validate all orders can be merged
    const mergeValidation = validateOrdersForMerge(orders);
    if (!mergeValidation.valid) {
      await session.abortTransaction();
      return res.status(400).json({ message: mergeValidation.message });
    }

    // Sort orders by creation date (oldest first will be the target)
    orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const targetOrder = orders[0];
    const sourceOrders = orders.slice(1);
    const totalAmountMerged = sourceOrders.reduce((sum, o) => sum + o.total, 0);

    // Store state before changes for audit
    const beforeState = {
      targetOrderId: targetOrder._id,
      targetOrderTotal: targetOrder.total,
      targetOrderItems: targetOrder.items.length,
      sourceOrderIds: sourceOrders.map(o => o._id),
      sourceOrderTotals: sourceOrders.map(o => o.total),
      sourceOrderItemCounts: sourceOrders.map(o => o.items.length)
    };

    // Combine items from all orders
    const combinedItems = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem.toString();
        if (combinedItems[itemId]) {
          combinedItems[itemId].quantity += item.quantity;
        } else {
          combinedItems[itemId] = {
            _id: item._id,
            menuItem: item.menuItem,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions || '',
            status: item.status
          };
        }
      });
    });

    // Recalculate totals
    const itemCountBefore = targetOrder.items.length;
    targetOrder.items = Object.values(combinedItems);
    const itemCountAfter = targetOrder.items.length;
    
    targetOrder.subtotal = targetOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    targetOrder.tax = targetOrder.subtotal * 0.10;
    targetOrder.discount = targetOrder.discount || 0;
    targetOrder.total = targetOrder.subtotal + targetOrder.tax - targetOrder.discount;

    // Record merge in mergeHistory
    recordOrderMerge(
      targetOrder,
      sourceOrders.map(o => o._id),
      itemCountBefore,
      itemCountAfter,
      beforeState.targetOrderTotal,
      targetOrder.total,
      {
        mergedBy: userId,
        mergedByName: userName,
        mergedByRole: userRole,
        reason
      }
    );

    // Add merge metadata
    targetOrder.mergedAt = new Date();
    targetOrder.originalOrderIds = orders.map(o => o.orderNumber || o._id.toString());
    targetOrder.mergeNote = `Merged ${orders.length} orders: ${targetOrder.originalOrderIds.join(', ')}`;

    await targetOrder.save({ session });

    // Mark source orders as merged
    for (const sourceOrder of sourceOrders) {
      sourceOrder.isMerged = true;
      sourceOrder.mergedAt = new Date();
      sourceOrder.mergeNote = `Merged into order ${targetOrder.orderNumber || targetOrder._id}`;
      await sourceOrder.save({ session });

      // Remove from table's currentOrders array
      const sourceTable = await Table.findById(sourceOrder.table).session(session);
      if (sourceTable) {
        sourceTable.currentOrders = sourceTable.currentOrders.filter(
          orderId => orderId.toString() !== sourceOrder._id.toString()
        );

        if (sourceTable.currentOrders.length === 0) {
          sourceTable.status = 'available';
        }

        await sourceTable.save({ session });
      }
    }

    // Commit transaction
    await session.commitTransaction();

    // Log to audit service (after transaction succeeds)
    await auditService.logOrderMerge({
      resultingOrderId: targetOrder._id,
      mergedOrderIds: sourceOrders.map(o => o._id),
      branchId: targetOrder.branch,
      performedBy: userId,
      performedByName: userName,
      performedByRole: userRole,
      performedByEmail: req.user?.email,
      totalAmountMerged,
      reason
    });

    // Emit socket events
    emitToBranch(targetOrder.branch, 'order_merged', {
      resultingOrderId: targetOrder._id,
      mergedOrderIds: sourceOrders.map(o => o._id),
      resultingOrderTotal: targetOrder.total,
      mergeCount: orders.length,
      timestamp: new Date()
    });

    // Populate and return merged order
    const mergedOrder = await Order.findById(targetOrder._id)
      .populate('items.menuItem')
      .populate('table');

    res.json({
      success: true,
      message: `Successfully merged ${orders.length} orders`,
      order: mergedOrder,
      mergedOrderIds: sourceOrders.map(o => o._id)
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Merge orders error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Update order status (with lifecycle validation)
// @route   PUT /api/orders/:id/status
// @access  Manager
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate transition
    const validation = validateStatusTransition(order.status, status);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Update status
    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Emit socket event for status change
    emitToBranch(order.branch, 'order_status_changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?.tableNumber,
      previousStatus,
      newStatus: status,
      timestamp: new Date()
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    res.json({
      success: true,
      message: `Order status updated: ${previousStatus} → ${status}`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close order (PAID → CLOSED)
// @route   POST /api/orders/:id/close
// @access  Manager
const closeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status
    if (order.status !== 'paid') {
      return res.status(400).json({
        message: `Cannot close order. Current status: ${order.status}. Order must be PAID before closing.`
      });
    }

    // Update status to closed
    order.status = 'closed';
    order.completedAt = Date.now();
    await order.save();

    // Remove from table's currentOrders array
    const table = await Table.findById(order.table);
    if (table) {
      table.currentOrders = table.currentOrders.filter(
        orderId => orderId.toString() !== order._id.toString()
      );
      // Set status to available only if no more orders
      if (table.currentOrders.length === 0) {
        table.status = 'available';
      }
      await table.save();
    }

    // Emit socket event
    emitToBranch(order.branch, 'order_closed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?.tableNumber,
      timestamp: new Date()
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    res.json({
      success: true,
      message: 'Order closed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download bill PDF
// @route   GET /api/orders/:id/bill
// @access  Manager
const downloadBill = async (req, res) => {
  try {
    const { splitIndex, splitType, splitCount } = req.query;
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem')
      .populate('table');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let pdfBuffer;
    
    if (splitIndex !== undefined && splitType) {
      // Generate specific split bill
      const bills = await billService.generateSplitBills(
        order, 
        splitType, 
        parseInt(splitCount) || 2,
        [] // For now, item split needs more logic to pass items
      );
      pdfBuffer = bills[parseInt(splitIndex)];
    } else {
      pdfBuffer = await billService.generateThermalBill(order);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Bill-${order.orderNumber || order._id}${splitIndex !== undefined ? `-split-${parseInt(splitIndex)+1}` : ''}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Bill Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order details (items, customer info, etc.)
// @route   PUT /api/orders/:id
// @access  Manager
const updateOrder = async (req, res) => {
  try {
    const { 
      items, 
      customerPhone, 
      customerName, 
      taxNumber,
      customerGSTN,
      tags,
      isFavorite,
      isComplementary,
      complementaryAmount,
      complementaryReason,
      subtotal,
      tax,
      cgst,
      sgst,
      cgstRate,
      sgstRate,
      discount,
      roundOff,
      total
    } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const validation = validateOrderForModification(order);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    if (items) {
      // If items are provided, we can either recalculate or trust the frontend
      // For now, let's trust the frontend if totals are also provided, 
      // otherwise use the service
      if (total !== undefined) {
        order.items = items;
        order.subtotal = subtotal;
        order.tax = tax;
        order.cgst = cgst;
        order.sgst = sgst;
        order.cgstRate = cgstRate;
        order.sgstRate = sgstRate;
        order.discount = discount;
        order.roundOff = roundOff;
        order.total = total;
      } else {
        const calculation = await orderService.calculateOrderTotals(items);
        order.items = calculation.items;
        order.subtotal = calculation.subtotal;
        order.tax = calculation.tax;
        order.total = calculation.total;
      }
    }

    if (customerPhone !== undefined) order.customerPhone = customerPhone;
    if (customerName !== undefined) order.customerName = customerName;
    if (taxNumber !== undefined) order.taxNumber = taxNumber;
    if (customerGSTN !== undefined) order.customerGSTN = customerGSTN;
    if (tags !== undefined) order.tags = tags;
    if (isFavorite !== undefined) order.isFavorite = isFavorite;
    if (isComplementary !== undefined) order.isComplementary = isComplementary;
    if (complementaryAmount !== undefined) order.complementaryAmount = complementaryAmount;
    if (complementaryReason !== undefined) order.complementaryReason = complementaryReason;

    const updatedOrder = await order.save();

    emitToBranch(order.branch, 'order_updated', {
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      total: updatedOrder.total,
      items: updatedOrder.items
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getOrder,
  addItemsToOrder,
  updateItemQuantity,
  removeItemFromOrder,
  cancelOrder,
  updateOrderStatus,
  closeOrder,
  mergeOrders,
  getMergePreview,
  applyCoupon,
  checkoutOrder,
  sessionCheckout,
  sendWhatsappBill,
  downloadBill
};
