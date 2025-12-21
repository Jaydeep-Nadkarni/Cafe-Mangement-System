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
    const { branchCode, tableNumber, items, customerCount, customerName, customerPhone, chefNotes } = req.body;

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

    // Process items first to calculate totals
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

    // TABLE SESSION LOGIC: Check for active session
    // 1. Find ANY active order (paid or unpaid) to get the sessionId
    const lastActiveOrder = await Order.findOne({
      table: table._id,
      status: { $nin: ['closed', 'cancelled'] }
    }).sort({ createdAt: -1 });

    let sessionId;
    if (lastActiveOrder && lastActiveOrder.sessionId) {
      sessionId = lastActiveOrder.sessionId;
      console.log('Found active session:', sessionId);
    } else {
      sessionId = `${table._id}-${Date.now()}`;
      console.log('Creating new session:', sessionId);
    }

    // 2. Check for an existing UNPAID order to merge into
    const existingActiveOrder = await Order.findOne({
      table: table._id,
      paymentStatus: 'unpaid',
      status: { $nin: ['closed', 'cancelled'] }
    }).sort({ createdAt: -1 });

    if (existingActiveOrder) {
      console.log('Merging into existing unpaid order:', existingActiveOrder._id);
      
      // Ensure sessionId matches (just in case)
      if (!existingActiveOrder.sessionId) {
        existingActiveOrder.sessionId = sessionId;
      }
      
      // Merge items
      existingActiveOrder.items.push(...processedItems);
      existingActiveOrder.subtotal += subtotal;
      existingActiveOrder.tax += tax;
      existingActiveOrder.total += total;
      
      // Update customer info if provided
      if (customerName) existingActiveOrder.customerName = customerName;
      if (customerPhone) existingActiveOrder.customerPhone = customerPhone;
      if (chefNotes) existingActiveOrder.chefNotes = (existingActiveOrder.chefNotes ? existingActiveOrder.chefNotes + '\n' : '') + chefNotes;

      const savedOrder = await existingActiveOrder.save();
      console.log('Order merged:', savedOrder._id);

      const populatedOrder = await Order.findById(savedOrder._id)
        .populate('branch')
        .populate('table')
        .populate('items.menuItem');

      // Emit update event
      const branchRoom = `branch_${branch._id}`;
      req.io.to(branchRoom).emit('order_updated', {
        orderId: populatedOrder._id,
        orderNumber: populatedOrder.orderNumber,
        table: table.tableNumber,
        total: populatedOrder.total,
        items: populatedOrder.items,
        timestamp: new Date()
      });

      return res.status(200).json(populatedOrder);
    }

    // 3. If no unpaid order exists, create NEW order but link to SAME session
    console.log('Creating new order in session:', sessionId);

    const order = new Order({
      branch: branch._id,
      table: table._id,
      items: processedItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: 'created',
      paymentStatus: 'unpaid',
      paymentMethod: null, // Will be set when payment is made
      customerCount: customerCount || 1,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      chefNotes: chefNotes || '',
      sessionId: sessionId,  // Attach to session for grouping
      sessionPerson: customerName || 'QR Order',
      orderType: 'pay_later'  // QR orders default to pay_later
    });

    const savedOrder = await order.save();
    console.log('Order created:', savedOrder._id, 'OrderNumber:', savedOrder.orderNumber);

    // Add to table's currentOrders array
    if (!table.currentOrders) {
      table.currentOrders = [];
    }
    table.currentOrders.push(savedOrder._id);
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

    res.status(201).json({
      ...populatedOrder.toObject(),
      isExistingOrder: false,
      message: 'New order created successfully'
    });
  } catch (error) {
    console.error('Error creating QR order:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm online payment for an order
// @route   POST /api/public/orders/:orderId/confirm-payment
// @access  Public
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    console.log('Confirming payment for order:', orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment status
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod || 'online';
    order.paidAt = new Date();
    order.status = 'confirmed';
    
    // Store Razorpay payment details if available
    if (razorpayPaymentId) {
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpayOrderId = razorpayOrderId;
      order.razorpaySignature = razorpaySignature;
    }

    await order.save();
    console.log('Payment confirmed for order:', order.orderNumber);

    // Emit real-time event to branch manager
    const branchRoom = `branch_${order.branch}`;
    req.io.to(branchRoom).emit('payment_confirmation', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      timestamp: new Date()
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error confirming payment:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public menu items (for customer-facing menu)
// @route   GET /api/public/menu
// @access  Public
const getPublicMenu = async (req, res) => {
  try {
    const { branchCode } = req.query;
    
    // Get menu items - filter by availability and not deleted
    let query = { 
      isAvailable: true,
      isDeleted: { $ne: true }
    };
    
    // If branchCode is provided, filter by that branch OR items with no branch assigned (global items)
    if (branchCode) {
      const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
      if (branch) {
        query.$or = [
          { branch: branch._id },
          { branch: null },
          { branch: { $exists: false } }
        ];
      } else {
        // If branch not found, still show global items
        query.$or = [
          { branch: null },
          { branch: { $exists: false } }
        ];
      }
    }

    const menuItems = await MenuItem.find(query).sort({ sortOrder: 1, category: 1, name: 1 });
    
    // Transform to match frontend expected format
    const transformedItems = menuItems.map(item => ({
      id: item._id,
      _id: item._id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image: item.image || `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop`,
      tag: item.tag || null,
      sizes: item.sizes || null,
      isAvailable: item.isAvailable
    }));

    res.json(transformedItems);
  } catch (error) {
    console.error('Error fetching public menu:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public categories (all active categories with available items)
// @route   GET /api/public/categories
// @access  Public
const getPublicCategories = async (req, res) => {
  try {
    const { branchCode } = req.query;
    
    // Build branch query for categories
    let branchQuery = {};
    let branchId = null;

    if (branchCode) {
      const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
      if (branch) {
        branchId = branch._id;
        branchQuery.$or = [
          { branch: branch._id },
          { branch: null },
          { branch: { $exists: false } }
        ];
      }
    }

    // 1. Get all active categories
    const Category = require('../models/Category');
    const allCategories = await Category.find({
      isActive: true,
      ...branchQuery
    }).sort({ sortOrder: 1, name: 1 });

    // 2. Check for active items in each category
    // We only want to show categories that have at least one available item
    const MenuItem = require('../models/MenuItem');
    
    // Build item query
    let itemQuery = {
      isAvailable: true,
      isDeleted: { $ne: true }
    };

    if (branchId) {
      itemQuery.$or = [
        { branch: branchId },
        { branch: null },
        { branch: { $exists: false } }
      ];
    } else {
      itemQuery.$or = [
        { branch: null },
        { branch: { $exists: false } }
      ];
    }

    // Aggregate to find categories with items
    const activeCategoriesStats = await MenuItem.aggregate([
      { $match: itemQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const activeCategorySlugs = activeCategoriesStats.map(s => s._id);

    // 3. Filter categories
    const visibleCategories = allCategories.filter(cat => 
      activeCategorySlugs.includes(cat.slug)
    );

    res.json(visibleCategories);
  } catch (error) {
    console.error('Error fetching public categories:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Routes
router.get('/branch/:code', getBranchByCode);
router.get('/table/:branchCode/:tableNumber', getTableByNumberAndBranch);
router.get('/menu', getPublicMenu);
router.get('/categories', getPublicCategories);
router.post('/orders', createQROrder);
router.post('/orders/:orderId/confirm-payment', confirmPayment);

module.exports = router;
