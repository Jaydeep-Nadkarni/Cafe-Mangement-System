const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const orderService = require('../services/orderService');

// @desc    Get branch by code (PUBLIC - for QR code scanning)
// @route   GET /api/public/branch/:code
// @access  Public
const getBranchByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const branch = await Branch.findOne({ branchCode: code.toUpperCase() });

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get table by number and branch code (PUBLIC - for QR code scanning)
// @route   GET /api/public/table/:branchCode/:tableNumber
// @access  Public
const getTableByNumberAndBranch = async (req, res) => {
  try {
    const { branchCode, tableNumber } = req.params;

    // Get branch first
    const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Get table
    const table = await Table.findOne({
      branch: branch._id,
      tableNumber: parseInt(tableNumber)
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create order from QR code (PUBLIC - no authentication required)
// @route   POST /api/public/orders
// @access  Public
const createQROrder = async (req, res) => {
  try {
    const { branchCode, tableNumber, items, customerCount, customerName, customerPhone } = req.body;

    console.log('Creating QR Order:', { branchCode, tableNumber, itemCount: items?.length, customerName });

    // Validate inputs
    if (!branchCode || !tableNumber || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields: branchCode, tableNumber, items' });
    }

    // Get branch
    const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
    if (!branch) {
      console.error('Branch not found:', branchCode);
      return res.status(404).json({ message: 'Branch not found' });
    }
    console.log('Branch found:', branch._id);

    // Get table
    const table = await Table.findOne({
      branch: branch._id,
      tableNumber: parseInt(tableNumber)
    });

    if (!table) {
      console.error('Table not found:', tableNumber, 'in branch', branch._id);
      return res.status(404).json({ message: 'Table not found' });
    }
    console.log('Table found:', table._id);

    if (table.currentOrder) {
      console.error('Table already has an active order:', table.currentOrder);
      return res.status(400).json({ message: 'Table is already occupied. Please contact staff.' });
    }

    // Process items - convert local IDs to MongoDB ObjectIds and validate
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Find the menu item by name or try to use the ID as a fallback
      let menuItem;
      
      if (item.menuItem && typeof item.menuItem === 'string' && item.menuItem.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a MongoDB ObjectId
        menuItem = await MenuItem.findById(item.menuItem);
      } else if (item.name) {
        // Search by name
        menuItem = await MenuItem.findOne({ name: item.name });
      } else {
        console.error('Invalid menu item:', item);
        return res.status(400).json({ message: `Invalid menu item: missing name or valid ObjectId` });
      }

      if (!menuItem) {
        console.error('Menu item not found:', item.name || item.menuItem);
        return res.status(404).json({ message: `Menu item not found: ${item.name || item.menuItem}` });
      }

      if (!menuItem.isAvailable) {
        console.error('Menu item unavailable:', menuItem.name);
        return res.status(400).json({ message: `Menu item is not available: ${menuItem.name}` });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || '',
        status: 'pending'
      });
      
      console.log('  Added item:', item.quantity, 'x', menuItem.name, '- Rs.', menuItem.price);
    }

    // Calculate tax
    const taxRate = 0.10;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Create order
    const order = new Order({
      branch: branch._id,
      table: table._id,
      items: processedItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: 'pending',
      customerCount: customerCount || 1,
      customerName: customerName || null,
      customerPhone: customerPhone || null
    });

    const savedOrder = await order.save();
    console.log('Order created:', savedOrder._id, 'OrderNumber:', savedOrder.orderNumber);

    // Update table status
    table.currentOrder = savedOrder._id;
    table.status = 'occupied';
    await table.save();
    console.log('Table updated to occupied');

    // Populate order details before returning
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('branch')
      .populate('table')
      .populate('items.menuItem');

    // Emit real-time event to branch manager
    const branchRoom = `branch_${branch._id}`;
    req.io.to(branchRoom).emit('new_order', {
      orderId: populatedOrder._id,
      data: populatedOrder,
      timestamp: new Date()
    });
    console.log('Emitted new_order event to room:', branchRoom);

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating QR order:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Routes
router.get('/branch/:code', getBranchByCode);
router.get('/table/:branchCode/:tableNumber', getTableByNumberAndBranch);
router.post('/orders', createQROrder);

module.exports = router;
