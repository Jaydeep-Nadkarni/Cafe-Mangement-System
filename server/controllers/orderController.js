const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const orderService = require('../services/orderService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Manager
const createOrder = async (req, res) => {
  try {
    const { tableId, items, customerCount } = req.body;
    
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
      customerCount: customerCount || 1
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

    if (order.status !== 'active') {
      return res.status(400).json({ message: 'Order is not active' });
    }

    order.paymentMethod = paymentMethod;
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

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  addItemsToOrder,
  applyCoupon,
  checkoutOrder
};
