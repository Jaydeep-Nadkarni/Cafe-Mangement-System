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

    if (table.currentOrder) {
      console.log('Table already has an active order, adding items to existing order:', table.currentOrder);
      
      // Add items to existing order instead of creating a new one
      const existingOrder = await Order.findById(table.currentOrder);
      
      if (!existingOrder) {
        return res.status(404).json({ message: 'Active order not found for this table' });
      }
      
      // Process new items
      let additionalSubtotal = 0;
      
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
        additionalSubtotal += itemTotal;

        // Check if item already exists in order
        const existingItemIndex = existingOrder.items.findIndex(
          orderItem => orderItem.menuItem.toString() === menuItem._id.toString()
        );

        if (existingItemIndex !== -1) {
          // Item already exists, increment quantity
          existingOrder.items[existingItemIndex].quantity += item.quantity;
          console.log('  Updated item quantity:', menuItem.name, '- New quantity:', existingOrder.items[existingItemIndex].quantity);
        } else {
          // Add new item to order
          existingOrder.items.push({
            menuItem: menuItem._id,
            quantity: item.quantity,
            price: menuItem.price,
            specialInstructions: item.specialInstructions || '',
            status: 'pending'
          });
          console.log('  Added new item:', item.quantity, 'x', menuItem.name);
        }
      }

      // Recalculate totals
      const subtotal = existingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxRate = 0.10;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      existingOrder.subtotal = subtotal;
      existingOrder.tax = tax;
      existingOrder.total = total;
      
      // Update customer info if provided
      if (customerName) existingOrder.customerName = customerName;
      if (customerPhone) existingOrder.customerPhone = customerPhone;
      if (chefNotes) existingOrder.chefNotes = (existingOrder.chefNotes || '') + '\n' + chefNotes;

      const updatedOrder = await existingOrder.save();
      console.log('Order updated:', updatedOrder._id, 'New total:', updatedOrder.total);

      // Populate order details before returning
      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('branch')
        .populate('table')
        .populate('items.menuItem');

      // Emit real-time event to branch manager
      const branchRoom = `branch_${populatedOrder.branch._id}`;
      req.io.to(branchRoom).emit('order_updated', {
        orderId: populatedOrder._id,
        data: populatedOrder,
        timestamp: new Date()
      });
      console.log('Emitted order_updated event to room:', branchRoom);

      // Return with 200 OK instead of 201 Created since it's an update
      res.status(200).json(populatedOrder);
      return;
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
      paymentStatus: 'unpaid',
      paymentMethod: null, // Will be set when payment is made
      customerCount: customerCount || 1,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      chefNotes: chefNotes || ''
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
    order.status = 'in_progress';
    
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
    
    // Get menu items - if branchCode provided, filter by branch
    let query = { isAvailable: true };
    
    if (branchCode) {
      const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
      if (branch) {
        query.branch = branch._id;
      }
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    
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

// Routes
router.get('/branch/:code', getBranchByCode);
router.get('/table/:branchCode/:tableNumber', getTableByNumberAndBranch);
router.get('/menu', getPublicMenu);
router.post('/orders', createQROrder);
router.post('/orders/:orderId/confirm-payment', confirmPayment);

module.exports = router;
