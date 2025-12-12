const Razorpay = require('razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new order for payment
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Receipt ID for the order
 * @returns {Promise} Order details
 */
const createOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Verification result
 */
const verifyPayment = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  return generatedSignature === signature;
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
};
