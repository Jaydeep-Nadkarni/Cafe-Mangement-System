const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const orderService = require('../services/orderService');
const billService = require('../services/billService');
const whatsappService = require('../services/whatsappService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Manager
const createOrder = async (req, res) => {
  try {
    const { tableId, items, customerCount, chefNotes } = req.body;
    
    // Verify table belongs to manager's branch
    const table = await Table.findById(tableId).populate('branch');
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.branch.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this branch' });
    }

    // Multiple orders per table are now allowed
    // No check for existing orders

    // Calculate totals
    const calculation = await orderService.calculateOrderTotals(items);

    const order = new Order({
      branch: table.branch._id,
      table: tableId,
      items: calculation.items,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      total: calculation.total,
      status: 'active',
      customerCount: customerCount || 1,
      chefNotes: chefNotes || ''
    });

    const savedOrder = await order.save();

    // Add to currentOrders array
    if (!table.currentOrders) {
      table.currentOrders = [];
    }
    table.currentOrders.push(savedOrder._id);
    table.status = 'occupied';
    await table.save();

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

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot modify closed order' });
    }

    // Merge new items with existing items
    // We need to reconstruct the items array for calculation
    const currentItems = order.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.notes
    }));

    const allItems = [...currentItems, ...items];

    // Recalculate everything
    const calculation = await orderService.calculateOrderTotals(allItems, order.coupon);

    order.items = calculation.items;
    order.subtotal = calculation.subtotal;
    order.tax = calculation.tax;
    order.discount = calculation.discount;
    order.total = calculation.total;

    await order.save();
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
    const { paymentMethod, amountPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already ' + order.status });
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'paid';
    order.paidAt = Date.now();
    order.status = 'completed';
    order.completedAt = Date.now();
    
    // Simple payment logic
    if (amountPaid < order.total) {
      return res.status(400).json({ message: 'Insufficient payment amount' });
    }
    
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

    // Emit real-time event to branch manager for order completion
    if (req.io && order.branch) {
      const branchRoom = `branch_${order.branch}`;
      req.io.to(branchRoom).emit('order_completed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        timestamp: new Date()
      });
      console.log('Emitted order_completed event to room:', branchRoom);
    }

    res.json(order);
  } catch (error) {
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

    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'merged') {
      return res.status(400).json({ message: 'Cannot modify closed order' });
    }

    // Filter out the item
    const initialLength = order.items.length;
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
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Manager
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    order.status = 'cancelled';
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

    res.json({ message: 'Order cancelled successfully' });
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
    
    if (uniqueTables.length > 1) {
      return res.status(400).json({ 
        message: 'Cannot merge orders from different tables',
        validation: { valid: false, reason: 'different_tables' }
      });
    }

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
    
    const { orderIds } = req.body;

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

    // Validation: Same table
    const tableIds = orders.map(o => o.table?._id?.toString()).filter(Boolean);
    const uniqueTables = [...new Set(tableIds)];
    
    if (uniqueTables.length > 1) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Cannot merge orders from different tables' 
      });
    }

    // Validation: All unpaid
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    if (paidOrders.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Cannot merge paid orders. All orders must be unpaid.' 
      });
    }

    // Validation: Active/Pending only
    const invalidStatus = orders.filter(o => !['active', 'pending'].includes(o.status));
    if (invalidStatus.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Can only merge active or pending orders' 
      });
    }

    // Sort orders by creation date (oldest first will be the target)
    orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const targetOrder = orders[0];
    const sourceOrders = orders.slice(1);

    // Combine items from all orders
    const combinedItems = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem.toString();
        if (combinedItems[itemId]) {
          combinedItems[itemId].quantity += item.quantity;
        } else {
          combinedItems[itemId] = {
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
    targetOrder.items = Object.values(combinedItems);
    targetOrder.subtotal = targetOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    targetOrder.tax = targetOrder.subtotal * 0.10;
    targetOrder.total = targetOrder.subtotal + targetOrder.tax;
    
    // Add merge metadata to target order
    targetOrder.isMerged = true;
    targetOrder.mergedAt = new Date();
    targetOrder.originalOrderIds = orders.map(o => o.orderNumber || o._id.toString());
    targetOrder.mergeNote = `Merged ${orders.length} orders: ${targetOrder.originalOrderIds.join(', ')}`;

    await targetOrder.save({ session });

    // Mark source orders as merged
    for (const sourceOrder of sourceOrders) {
      sourceOrder.status = 'merged';
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

module.exports = {
  createOrder,
  getOrder,
  addItemsToOrder,
  removeItemFromOrder,
  cancelOrder,
  mergeOrders,
  getMergePreview,
  applyCoupon,
  checkoutOrder,
  sendWhatsappBill
};
