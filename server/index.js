const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const { connectDB } = require('./config/database');
const models = require('./models');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const branchRoutes = require('./routes/branchRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const gameRoutes = require('./routes/gameRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { initRealtime } = require('./services/realtimeService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Initialize Real-time Service
initRealtime(io);

const PORT = process.env.PORT || 5000;

// ==================== DATABASE CONNECTION ====================
connectDB();

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/payment', paymentRoutes);

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

// ==================== WHATSAPP & PDF ENDPOINTS ====================

app.post('/api/orders/send-whatsapp-bill', async (req, res) => {
  try {
    const { orderId, amount, method, customerName, customerPhone, items } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ success: false, error: 'Customer phone number is required' });
    }

    console.log(`Generating bill for Order ${orderId} to ${customerPhone}`);

    // 1. Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    // Header
    doc.fontSize(20).text('Cafe Management System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text('123 Coffee Street, Tech City', { align: 'center' });
    doc.moveDown(1);
    
    // Receipt Details
    doc.fontSize(16).text('ORDER RECEIPT', { align: 'center', underline: true });
    doc.moveDown(1);
    
    doc.fontSize(10);
    doc.text(`Order ID: ${orderId}`, { align: 'left' });
    doc.text(`Date: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.text(`Customer: ${customerName || 'Guest'}`, { align: 'left' });
    doc.text(`Phone: ${customerPhone}`, { align: 'left' });
    doc.text(`Payment Method: ${method === 'online' ? 'Online Payment' : 'Cash at Counter'}`, { align: 'left' });
    doc.moveDown(1);
    
    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 350, tableTop);
    doc.text('Total', 450, tableTop);
    doc.font('Helvetica');
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown(1.5);

    // Items - Handle both old format {itemId: qty} and new format {key: {item, quantity, size, price}}
    let y = doc.y;
    if (items) {
        Object.entries(items).forEach(([key, value]) => {
            let itemName, qty, price, lineTotal;
            
            // New format: value is an object with item, quantity, size, price
            if (typeof value === 'object' && value.item) {
                itemName = value.item.name;
                if (value.size && value.item.sizes) {
                    const sizeInfo = value.item.sizes.find(s => s.name === value.size);
                    itemName += ` (${sizeInfo?.label || value.size})`;
                    price = sizeInfo?.price || value.item.price;
                } else {
                    price = value.item.price;
                }
                qty = value.quantity;
                lineTotal = price * qty;
            } else {
                // Old format: key is itemId, value is quantity
                const item = MENU_ITEMS.find(i => i.id === parseInt(key));
                if (item) {
                    itemName = item.name;
                    price = item.price;
                    qty = value;
                    lineTotal = price * qty;
                }
            }
            
            if (itemName) {
                doc.text(itemName, 50, y);
                doc.text(qty.toString(), 300, y);
                doc.text(`₹${price.toFixed(2)}`, 350, y);
                doc.text(`₹${lineTotal.toFixed(2)}`, 450, y);
                y += 20;
            }
        });
    }
    
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    
    // Total
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Total Amount: ₹${amount.toFixed(2)}`, 350, y);
    
    // Footer
    doc.fontSize(10).font('Helvetica');
    doc.text('Thank you for your visit!', 50, y + 50, { align: 'center' });
    
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise((resolve) => {
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
    });

    // 2. Send to WhatsApp
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';

    let whatsappStatus = 'simulated';

    if (whatsappToken && phoneId && whatsappToken !== 'your_whatsapp_access_token_here') {
        try {
            // A. Upload Media
            const form = new FormData();
            form.append('file', pdfBuffer, { filename: `bill_${orderId}.pdf`, contentType: 'application/pdf' });
            form.append('type', 'application/pdf');
            form.append('messaging_product', 'whatsapp');

            const uploadResponse = await axios.post(`${apiUrl}/${phoneId}/media`, form, {
                headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    ...form.getHeaders()
                }
            });

            const mediaId = uploadResponse.data.id;

            // B. Send Document Message
            await axios.post(`${apiUrl}/${phoneId}/messages`, {
                messaging_product: 'whatsapp',
                to: customerPhone,
                type: 'document',
                document: {
                    id: mediaId,
                    caption: `Here is your bill for Order ${orderId}`,
                    filename: `bill_${orderId}.pdf`
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            whatsappStatus = 'sent';
        } catch (waError) {
            console.error('WhatsApp API Error:', waError.response?.data || waError.message);
            whatsappStatus = 'failed';
            
            // Fallback to text message if media upload fails
            try {
                 await axios.post(`${apiUrl}/${phoneId}/messages`, {
                    messaging_product: 'whatsapp',
                    to: customerPhone,
                    type: 'text',
                    text: {
                        body: `*Cafe Management System*\n\nHello ${customerName},\nHere is your bill for Order *${orderId}*.\n\nTotal Amount: *$${amount.toFixed(2)}*\n\n(PDF generation failed, but here is your summary)`
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${whatsappToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                whatsappStatus = 'sent_text_fallback';
            } catch (textError) {
                console.error('WhatsApp Text Fallback Error:', textError.response?.data || textError.message);
            }
        }
    } else {
        console.log('WhatsApp credentials not configured. Skipping actual send.');
    }

    res.json({ 
        success: true, 
        message: 'Bill generated', 
        whatsappStatus,
        pdfGenerated: true 
    });

  } catch (error) {
    console.error('Error processing bill:', error);
    res.status(500).json({ success: false, error: 'Failed to process bill' });
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

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Cafe Management System - API Server     ║
╠════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}     ║
║  Environment: ${process.env.NODE_ENV || 'development'}                     ║
║  CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'} ║
║  MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management'} ║
║  Socket.io: Enabled                        ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
