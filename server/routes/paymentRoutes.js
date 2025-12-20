const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  createPaymentOrder, 
  verifyPayment,
  handleWebhook
} = require('../controllers/paymentController');

// Webhook route (must be before protect middleware)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

module.exports = router;
