const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== SAMPLE DATA ====================
const MENU_ITEMS = [
  {
    id: 1,
    name: 'Espresso',
    description: 'Strong and bold',
    price: 3.99,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=500&h=500&fit=crop'
  },
  {
    id: 2,
    name: 'Cappuccino',
    description: 'Creamy and smooth',
    price: 4.49,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&h=500&fit=crop'
  },
  {
    id: 3,
    name: 'Croissant',
    description: 'Buttery and flaky',
    price: 3.50,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1444950541872-8c2960214057?w=500&h=500&fit=crop'
  },
  {
    id: 4,
    name: 'Chocolate Muffin',
    description: 'Rich chocolate flavor',
    price: 3.99,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1616365696742-92418fb74db6?w=500&h=500&fit=crop'
  },
  {
    id: 5,
    name: 'Latte',
    description: 'Smooth and velvety',
    price: 4.99,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1541182286-21eaf810afe4?w=500&h=500&fit=crop'
  },
  {
    id: 6,
    name: 'Avocado Toast',
    description: 'Healthy and fresh',
    price: 6.99,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1570521044498-a3fca1ae97f7?w=500&h=500&fit=crop'
  },
  {
    id: 7,
    name: 'Cheesecake',
    description: 'Creamy and delicious',
    price: 5.99,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1553882900-f2b06423371f?w=500&h=500&fit=crop'
  },
  {
    id: 8,
    name: 'Club Sandwich',
    description: 'Triple layered goodness',
    price: 7.99,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&fit=crop'
  }
];

let orders = []; // In-memory order storage (use database in production)

// ==================== ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== MENU ENDPOINTS ====================

/**
 * GET /api/menu
 * Returns all menu items
 */
app.get('/api/menu', (req, res) => {
  try {
    res.json({
      success: true,
      data: MENU_ITEMS,
      count: MENU_ITEMS.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/menu/:id
 * Returns a single menu item by ID
 */
app.get('/api/menu/:id', (req, res) => {
  try {
    const item = MENU_ITEMS.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ORDER ENDPOINTS ====================

/**
 * POST /api/orders
 * Create a new order
 * Body: { items: [{itemId, quantity}], mobileNumber, customerName }
 */
app.post('/api/orders', (req, res) => {
  try {
    const { items, mobileNumber, customerName } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid mobile number is required'
      });
    }

    if (!customerName || customerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    // Calculate order total
    let orderTotal = 0;
    const orderItems = items.map(item => {
      const menuItem = MENU_ITEMS.find(m => m.id === item.itemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.itemId} not found`);
      }
      const itemTotal = menuItem.price * item.quantity;
      orderTotal += itemTotal;
      return {
        ...menuItem,
        quantity: item.quantity,
        itemTotal
      };
    });

    // Create order object
    const order = {
      orderId: `ORD_${Date.now()}`,
      items: orderItems,
      subtotal: orderTotal,
      tax: orderTotal * 0.08,
      total: orderTotal + (orderTotal * 0.08),
      mobileNumber,
      customerName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get order details by order ID
 */
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const order = orders.find(o => o.orderId === req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== RAZORPAY ENDPOINTS ====================

/**
 * POST /api/razorpay/create-order
 * Create a Razorpay order
 * Body: { amount, orderId, customerName, customerEmail, customerPhone }
 */
app.post('/api/razorpay/create-order', (req, res) => {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // In production, use actual Razorpay SDK
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET
    // });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR' });

    // Mock Razorpay order creation
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: amount * 100, // Convert to paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency: 'INR',
      receipt: orderId,
      offer_id: null,
      status: 'created',
      attempts: 0,
      notes: {
        customerName,
        customerEmail,
        customerPhone
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    res.json({
      success: true,
      data: razorpayOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/razorpay/verify-payment
 * Verify Razorpay payment signature
 * Body: { razorpayPaymentId, razorpayOrderId, razorpaySignature }
 */
app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Validate input
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Payment details are incomplete'
      });
    }

    // In production, verify signature with Razorpay
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    // hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    // const generated_signature = hmac.digest('hex');
    // const isValid = generated_signature === razorpaySignature;

    // Mock verification (always succeed in test mode)
    const isValid = true;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment signature verification failed'
      });
    }

    // Mark order as paid
    const order = orders.find(o => o.orderId === req.body.orderId);
    if (order) {
      order.status = 'paid';
      order.paymentId = razorpayPaymentId;
      order.paidAt = new Date().toISOString();
    }

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully',
      data: {
        razorpayPaymentId,
        razorpayOrderId,
        verified: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ERROR HANDLING ====================

/**
 * 404 Not Found
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Cafe Management System - API Server     ║
╠════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}     ║
║  Environment: ${process.env.NODE_ENV || 'development'}                     ║
║  CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'} ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
