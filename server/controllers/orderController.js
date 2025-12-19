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

    if (table.currentOrder) {
      return res.status(400).json({ message: 'Table is already occupied' });
    }

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

    // Update table status
    table.currentOrder = savedOrder._id;
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

    // Free up the table
    const table = await Table.findById(order.table);
    if (table) {
      table.currentOrder = null;
      table.status = 'available';
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

    // Free up table
    const table = await Table.findById(order.table);
    if (table) {
      table.currentOrder = null;
      table.status = 'available';
      await table.save();
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Merge orders
// @route   POST /api/orders/merge
// @access  Manager
const mergeOrders = async (req, res) => {
  try {
    const { sourceOrderId, targetOrderId } = req.body;

    const sourceOrder = await Order.findById(sourceOrderId);
    const targetOrder = await Order.findById(targetOrderId);

    if (!sourceOrder || !targetOrder) {
      return res.status(404).json({ message: 'One or both orders not found' });
    }

    if (sourceOrder.status !== 'active' && sourceOrder.status !== 'pending') {
       return res.status(400).json({ message: 'Source order is not active' });
    }
    
    // Combine items
    const sourceItems = sourceOrder.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.specialInstructions
    }));
    
    const targetItems = targetOrder.items.map(item => ({
      menuItemId: item.menuItem,
      quantity: item.quantity,
      notes: item.specialInstructions
    }));

    const allItems = [...targetItems, ...sourceItems];

    // Recalculate target
    const calculation = await orderService.calculateOrderTotals(allItems, targetOrder.coupon);

    targetOrder.items = calculation.items;
    targetOrder.subtotal = calculation.subtotal;
    targetOrder.tax = calculation.tax;
    targetOrder.discount = calculation.discount;
    targetOrder.total = calculation.total;
    
    await targetOrder.save();

    // Close source
    sourceOrder.status = 'merged';
    await sourceOrder.save();

    // Free source table
    const sourceTable = await Table.findById(sourceOrder.table);
    if (sourceTable) {
      sourceTable.currentOrder = null;
      sourceTable.status = 'available';
      await sourceTable.save();
    }

    res.json(targetOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  addItemsToOrder,
  removeItemFromOrder,
  cancelOrder,
  mergeOrders,
  applyCoupon,
  checkoutOrder,
  sendWhatsappBill
};
