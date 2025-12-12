const express = require('express');
const router = express.Router();

// Import route modules
// const menuRoutes = require('./menu');
// const orderRoutes = require('./orders');
// const paymentRoutes = require('./payment');
// const aiRoutes = require('./ai');

// Welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Cafe Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      menu: '/api/menu',
      orders: '/api/orders',
      payments: '/api/payments',
      ai: '/api/ai'
    }
  });
});

// Route modules (uncomment when implementing)
// router.use('/menu', menuRoutes);
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/ai', aiRoutes);

module.exports = router;
