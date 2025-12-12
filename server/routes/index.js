const express = require('express');
const router = express.Router();

// Import route modules
const menuRoutes = require('./menu');
const orderRoutes = require('./orders');
const paymentRoutes = require('./payment');
const aiRoutes = require('./ai');

// Welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Cafe Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      menu: '/api/menu',
      menuById: '/api/menu/:id',
      menuByCategory: '/api/menu/category/:category',
      categories: '/api/menu/categories',
      orders: '/api/orders',
      createOrder: 'POST /api/orders',
      orderById: '/api/orders/:orderId',
      updateOrderStatus: 'PATCH /api/orders/:orderId/status',
      payments: '/api/payment',
      ai: '/api/ai/chat'
    }
  });
});

// Route modules
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
