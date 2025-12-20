const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { emitToBranch, triggerStatsUpdate } = require('../services/realtimeService');
const { applyStatsDelta } = require('../services/analyticsService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Protected
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const options = {
      amount: Math.round(order.total * 100), // Amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      notes: {
        orderId: orderId
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      orderId: orderId
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Protected
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
    }

    // Find order and verify it's not already paid
    const order = await Order.findById(orderId).populate('table');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({ 
        success: true, 
        message: 'Payment already verified',
        orderId,
        alreadyPaid: true
      });
    }

    // Update order with payment details
    order.paymentStatus = 'paid';
    order.paymentMethod = 'online';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();

    // Update order status to 'paid' if ready
    if (order.status === 'ready') {
      order.status = 'paid';
    }

    await order.save();

    // Create/update Payment record
    const payment = await Payment.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        branch: order.branch,
        amount: order.total,
        paymentMethod: 'online',
        paymentGateway: 'razorpay',
        status: 'completed',
        'paymentReference.razorpayPaymentId': razorpay_payment_id,
        'paymentReference.razorpayOrderId': razorpay_order_id,
        'paymentReference.razorpaySignature': razorpay_signature,
        completedAt: new Date(),
        metadata: {
          verifiedAt: new Date(),
          verificationMethod: 'client'
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log(`[Payment] Order ${order.orderNumber} verified and marked as PAID`);

    // Apply stats delta for payment
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await applyStatsDelta(order.branch, {
      revenue: order.total,
      orders: 1,
      items: totalItems
    });

    // Emit real-time payment confirmation event
    emitToBranch(order.branch, 'payment_confirmation', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      tableId: order.table?._id,
      tableNumber: order.table?.tableNumber,
      timestamp: new Date(),
      // Color coding: red→green
      statusColor: 'green',
      previousColor: 'red'
    });

    // Emit order_paid event for stats update
    emitToBranch(order.branch, 'order_paid', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?._id,
      paymentMethod: 'online',
      amount: order.total,
      timestamp: new Date()
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      orderId,
      orderNumber: order.orderNumber,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment verification failed' 
    });
  }
};

// @desc    Handle Razorpay Webhook
// @route   POST /api/payment/webhook
// @access  Public (verified by signature)
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Webhook] Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Webhook] Received event: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(payload.order.entity);
        break;
      
      case 'refund.created':
        await handleRefundCreated(payload.refund.entity);
        break;
      
      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle payment.captured event
 * Updates order paymentStatus and emits real-time events
 */
const handlePaymentCaptured = async (paymentEntity) => {
  try {
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const amount = paymentEntity.amount / 100; // Convert from paise to rupees

    console.log(`[Webhook] Payment captured: ${razorpayPaymentId} for order: ${razorpayOrderId}`);

    // Find order by Razorpay order ID
    const order = await Order.findOne({ razorpayOrderId }).populate('table');

    if (!order) {
      console.error(`[Webhook] Order not found for Razorpay Order ID: ${razorpayOrderId}`);
      return;
    }

    // Verify order is not already paid
    if (order.paymentStatus === 'paid') {
      console.log(`[Webhook] Order ${order.orderNumber} already marked as paid`);
      return;
    }

    // Update order with payment details
    order.paymentStatus = 'paid';
    order.paymentMethod = 'online';
    order.razorpayPaymentId = razorpayPaymentId;
    order.paidAt = new Date();

    // Update order status to 'paid' if ready
    if (order.status === 'ready') {
      order.status = 'paid';
    }

    await order.save();

    // Create/update Payment record
    await Payment.findOneAndUpdate(
      { 
        'paymentReference.razorpayOrderId': razorpayOrderId 
      },
      {
        order: order._id,
        branch: order.branch,
        amount: amount,
        paymentMethod: 'online',
        paymentGateway: 'razorpay',
        status: 'completed',
        'paymentReference.razorpayPaymentId': razorpayPaymentId,
        'paymentReference.razorpayOrderId': razorpayOrderId,
        completedAt: new Date(),
        metadata: {
          webhookEvent: 'payment.captured',
          capturedAt: new Date(),
          method: paymentEntity.method,
          email: paymentEntity.email,
          contact: paymentEntity.contact
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log(`[Webhook] Order ${order.orderNumber} marked as PAID - Payment Status: ${order.paymentStatus}`);

    // Apply stats delta for payment
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await applyStatsDelta(order.branch, {
      revenue: order.total,
      orders: 1,
      items: totalItems
    });

    // Emit real-time payment confirmation event
    emitToBranch(order.branch, 'payment_confirmation', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      razorpayPaymentId,
      tableId: order.table?._id,
      tableNumber: order.table?.tableNumber,
      timestamp: new Date(),
      // Color coding: red→green
      statusColor: 'green',
      previousColor: 'red'
    });

    // Emit order_paid event for stats update
    emitToBranch(order.branch, 'order_paid', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      table: order.table?._id,
      paymentMethod: 'online',
      amount: order.total,
      timestamp: new Date()
    });

    // Trigger stats update
    triggerStatsUpdate(order.branch);

    console.log(`[Webhook] Payment confirmation events emitted for order ${order.orderNumber}`);
  } catch (error) {
    console.error('[Webhook] Error handling payment.captured:', error);
    throw error;
  }
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (paymentEntity) => {
  try {
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const errorCode = paymentEntity.error_code;
    const errorDescription = paymentEntity.error_description;

    console.log(`[Webhook] Payment failed: ${razorpayPaymentId} - ${errorDescription}`);

    // Find order
    const order = await Order.findOne({ razorpayOrderId }).populate('table');

    if (!order) {
      console.error(`[Webhook] Order not found for failed payment: ${razorpayOrderId}`);
      return;
    }

    // Update/create Payment record with failure
    await Payment.findOneAndUpdate(
      { 
        'paymentReference.razorpayOrderId': razorpayOrderId 
      },
      {
        order: order._id,
        branch: order.branch,
        amount: order.total,
        paymentMethod: 'online',
        paymentGateway: 'razorpay',
        status: 'failed',
        'paymentReference.razorpayPaymentId': razorpayPaymentId,
        'paymentReference.razorpayOrderId': razorpayOrderId,
        failureReason: `${errorCode}: ${errorDescription}`,
        metadata: {
          webhookEvent: 'payment.failed',
          failedAt: new Date(),
          errorCode,
          errorDescription
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Emit payment failure event
    emitToBranch(order.branch, 'payment_failed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId,
      errorCode,
      errorDescription,
      tableId: order.table?._id,
      tableNumber: order.table?.tableNumber,
      timestamp: new Date()
    });

    console.log(`[Webhook] Payment failure event emitted for order ${order.orderNumber}`);
  } catch (error) {
    console.error('[Webhook] Error handling payment.failed:', error);
    throw error;
  }
};

/**
 * Handle payment.authorized event (for later capture)
 */
const handlePaymentAuthorized = async (paymentEntity) => {
  try {
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    console.log(`[Webhook] Payment authorized: ${razorpayPaymentId}`);

    const order = await Order.findOne({ razorpayOrderId }).populate('table');

    if (!order) {
      console.error(`[Webhook] Order not found for authorized payment: ${razorpayOrderId}`);
      return;
    }

    // Update Payment record to processing
    await Payment.findOneAndUpdate(
      { 
        'paymentReference.razorpayOrderId': razorpayOrderId 
      },
      {
        order: order._id,
        branch: order.branch,
        amount: order.total,
        paymentMethod: 'online',
        paymentGateway: 'razorpay',
        status: 'processing',
        'paymentReference.razorpayPaymentId': razorpayPaymentId,
        'paymentReference.razorpayOrderId': razorpayOrderId,
        metadata: {
          webhookEvent: 'payment.authorized',
          authorizedAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Emit payment processing event
    emitToBranch(order.branch, 'payment_processing', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId,
      tableId: order.table?._id,
      tableNumber: order.table?.tableNumber,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[Webhook] Error handling payment.authorized:', error);
    throw error;
  }
};

/**
 * Handle order.paid event
 */
const handleOrderPaid = async (orderEntity) => {
  try {
    const razorpayOrderId = orderEntity.id;

    console.log(`[Webhook] Razorpay order paid: ${razorpayOrderId}`);

    const order = await Order.findOne({ razorpayOrderId }).populate('table');

    if (!order) {
      console.error(`[Webhook] Order not found for paid Razorpay order: ${razorpayOrderId}`);
      return;
    }

    // Order is fully paid at Razorpay level
    // Usually handled by payment.captured, but this is a backup
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      
      if (order.status === 'ready') {
        order.status = 'paid';
      }

      await order.save();

      // Apply stats delta
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await applyStatsDelta(order.branch, {
        revenue: order.total,
        orders: 1,
        items: totalItems
      });

      // Emit confirmation
      emitToBranch(order.branch, 'payment_confirmation', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.total,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        tableId: order.table?._id,
        tableNumber: order.table?.tableNumber,
        timestamp: new Date(),
        statusColor: 'green',
        previousColor: 'red'
      });

      triggerStatsUpdate(order.branch);
    }
  } catch (error) {
    console.error('[Webhook] Error handling order.paid:', error);
    throw error;
  }
};

/**
 * Handle refund.created event
 */
const handleRefundCreated = async (refundEntity) => {
  try {
    const razorpayPaymentId = refundEntity.payment_id;
    const refundAmount = refundEntity.amount / 100;

    console.log(`[Webhook] Refund created: ${refundEntity.id} for payment: ${razorpayPaymentId}`);

    const order = await Order.findOne({ razorpayPaymentId }).populate('table');

    if (!order) {
      console.error(`[Webhook] Order not found for refund payment ID: ${razorpayPaymentId}`);
      return;
    }

    // Update order payment status
    order.paymentStatus = 'refunded';
    await order.save();

    // Update Payment record
    await Payment.findOneAndUpdate(
      { 
        'paymentReference.razorpayPaymentId': razorpayPaymentId 
      },
      {
        status: 'refunded',
        metadata: {
          refundId: refundEntity.id,
          refundAmount,
          refundedAt: new Date()
        }
      }
    );

    // Apply negative stats delta for refund
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await applyStatsDelta(order.branch, {
      revenue: -refundAmount,
      orders: 0,
      items: -totalItems
    });

    // Emit refund event
    emitToBranch(order.branch, 'order_refunded', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: refundAmount,
      refundId: refundEntity.id,
      timestamp: new Date()
    });

    triggerStatsUpdate(order.branch);

    console.log(`[Webhook] Refund processed for order ${order.orderNumber}`);
  } catch (error) {
    console.error('[Webhook] Error handling refund.created:', error);
    throw error;
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};
