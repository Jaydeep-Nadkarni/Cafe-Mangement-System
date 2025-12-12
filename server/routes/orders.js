const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to orders data file
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

// Helper function to read orders data
const readOrdersData = async () => {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading orders data:', error);
    throw new Error('Unable to load orders data');
  }
};

// Helper function to write orders data
const writeOrdersData = async (orders) => {
  try {
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing orders data:', error);
    throw new Error('Unable to save order');
  }
};

// Generate unique order ID
const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// POST /api/orders - Create a new order
router.post('/', async (req, res, next) => {
  try {
    const { items, customerInfo, paymentMethod, specialInstructions } = req.body;
    
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }
    
    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and email are required'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }
    
    // Calculate total price
    const subtotal = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    // Create order object
    const newOrder = {
      orderId: generateOrderId(),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations || []
      })),
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || '',
        address: customerInfo.address || ''
      },
      pricing: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'processing',
      orderStatus: 'pending',
      specialInstructions: specialInstructions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTime: items.length * 3 // Rough estimate: 3 minutes per item
    };
    
    // Read existing orders and add new order
    const orders = await readOrdersData();
    orders.push(newOrder);
    
    // Save to file
    await writeOrdersData(orders);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders - Get all orders (optional: filter by customer email)
router.get('/', async (req, res, next) => {
  try {
    const orders = await readOrdersData();
    const { email, status } = req.query;
    
    let filteredOrders = orders;
    
    // Filter by customer email
    if (email) {
      filteredOrders = filteredOrders.filter(
        order => order.customerInfo.email.toLowerCase() === email.toLowerCase()
      );
    }
    
    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter(
        order => order.orderStatus === status
      );
    }
    
    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:orderId - Get single order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const orders = await readOrdersData();
    
    const order = orders.find(order => order.orderId === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:orderId/status - Update order status
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const orders = await readOrdersData();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }
    
    // Update order status
    orders[orderIndex].orderStatus = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    await writeOrdersData(orders);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: orders[orderIndex]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
