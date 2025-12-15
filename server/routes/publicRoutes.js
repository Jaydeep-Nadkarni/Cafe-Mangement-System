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
    const { branchCode, tableNumber, items, customerCount } = req.body;

    // Validate inputs
    if (!branchCode || !tableNumber || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Missing required fields: branchCode, tableNumber, items' });
    }

    // Get branch
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

    if (table.currentOrder) {
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
        // Try to find by local ID in a special way
        // For now, just reject this
        return res.status(400).json({ message: `Invalid menu item: missing name or valid ObjectId` });
      }

      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.name || item.menuItem}` });
      }

      if (!menuItem.isAvailable) {
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
      customerCount: customerCount || 1
    });

    const savedOrder = await order.save();

    // Update table status
    table.currentOrder = savedOrder._id;
    table.status = 'occupied';
    await table.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating QR order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Routes
router.get('/branch/:code', getBranchByCode);
router.get('/table/:branchCode/:tableNumber', getTableByNumberAndBranch);
router.post('/orders', createQROrder);

module.exports = router;
