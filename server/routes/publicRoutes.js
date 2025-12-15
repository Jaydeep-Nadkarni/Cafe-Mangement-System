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

    // Validate items exist and calculate totals
    const calculation = await orderService.calculateOrderTotals(items);

    // Create order
    const order = new Order({
      branch: branch._id,
      table: table._id,
      items: calculation.items,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      total: calculation.total,
      status: 'active',
      customerCount: customerCount || 1,
      isQROrder: true // Mark this as a QR order
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

// Routes
router.get('/branch/:code', getBranchByCode);
router.get('/table/:branchCode/:tableNumber', getTableByNumberAndBranch);
router.post('/orders', createQROrder);

module.exports = router;
