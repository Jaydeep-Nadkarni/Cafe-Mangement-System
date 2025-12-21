const axios = require('axios');
const FormData = require('form-data');
const CustomerPreferences = require('../models/CustomerPreferences');
const BroadcastLog = require('../models/BroadcastLog');
const Order = require('../models/Order');

// WhatsApp Business API Configuration
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v17.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || `https://graph.instagram.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

/**
 * Send bill via WhatsApp
 * @param {string} phoneNumber - Recipient phone number
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} filename - Name of the file
 */
const sendWhatsappBill = async (phoneNumber, pdfBuffer, filename = 'bill.pdf') => {
  try {
    if (!WHATSAPP_API_URL || !WHATSAPP_ACCESS_TOKEN) {
      console.warn('WhatsApp API not configured. Skipping message send.');
      return { success: false, message: 'WhatsApp API not configured' };
    }

    const form = new FormData();
    form.append('phone', phoneNumber);
    form.append('file', pdfBuffer, { filename });
    form.append('caption', 'Here is your bill from Cafe Management System.');

    const response = await axios.post(WHATSAPP_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp Bill Service Error:', error.message);
    return { 
      success: false, 
      error: error.response ? error.response.data : error.message 
    };
  }
};

/**
 * Get eligible customers for broadcast based on criteria
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - Array of eligible customer phone numbers
 */
const getEligibleCustomers = async (options = {}) => {
  try {
    const {
      targetAudience = 'opt_in_only',
      branches = [],
      minOrderValue = 0,
      maxOrderValue = null,
      lastOrderWithinDays = null,
      excludePhones = [],
      subscriptionType = null
    } = options;

    let eligiblePhones = [];

    if (targetAudience === 'opt_in_only') {
      // Get customers who opted in
      const preferences = await CustomerPreferences.find({
        optedOut: false,
        ...(subscriptionType && { [`subscriptions.${subscriptionType}`]: true }),
        'preferences.whatsapp': true
      }).select('phone');

      eligiblePhones = preferences.map(p => p.phone);
    } else if (targetAudience === 'all_customers') {
      // Get all customers with phone numbers from orders
      const orders = await Order.find({
        customerPhone: { $exists: true, $ne: null },
        ...(branches.length > 0 && { branch: { $in: branches } })
      })
        .distinct('customerPhone');

      eligiblePhones = orders.filter(phone => phone && phone.length === 10);
    } else if (targetAudience === 'vip_customers') {
      // Get customers with high spending
      const vipOrders = await Order.aggregate([
        {
          $match: {
            customerPhone: { $exists: true, $ne: null },
            ...(branches.length > 0 && { branch: { $in: branches } })
          }
        },
        {
          $group: {
            _id: '$customerPhone',
            totalSpent: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $match: {
            totalSpent: { $gte: minOrderValue, ...(maxOrderValue && { $lte: maxOrderValue }) },
            orderCount: { $gte: 3 }
          }
        }
      ]);

      eligiblePhones = vipOrders.map(order => order._id);
    } else if (targetAudience === 'recent_customers') {
      // Get customers who ordered recently
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (lastOrderWithinDays || 30));

      const recentOrders = await Order.find({
        customerPhone: { $exists: true, $ne: null },
        createdAt: { $gte: cutoffDate },
        ...(branches.length > 0 && { branch: { $in: branches } })
      }).distinct('customerPhone');

      eligiblePhones = recentOrders.filter(phone => phone && phone.length === 10);
    }

    // Remove excluded phones
    return eligiblePhones.filter(phone => !excludePhones.includes(phone));
  } catch (error) {
    console.error('Error getting eligible customers:', error);
    return [];
  }
};

/**
 * Send WhatsApp message to customer
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} message - Message object
 * @returns {Promise<Object>} - Result object
 */
const sendWhatsappMessage = async (phoneNumber, message) => {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        preview_url: true,
        body: message
      }
    };

    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Send broadcast to customers
 * @param {Object} broadcastData - Broadcast configuration
 * @returns {Promise<Object>} - Broadcast result with stats
 */
const sendBroadcast = async (broadcastData) => {
  try {
    const {
      broadcastLogId,
      title,
      content,
      broadcastType,
      targetAudience,
      branches,
      channels,
      filters,
      excludePhones = []
    } = broadcastData;

    // Get eligible customers
    const eligiblePhones = await getEligibleCustomers({
      targetAudience,
      branches,
      ...filters,
      excludePhones
    });

    // Update broadcast log
    const broadcastLog = await BroadcastLog.findByIdAndUpdate(
      broadcastLogId,
      {
        status: 'sending',
        startedAt: new Date(),
        'stats.totalRecipients': eligiblePhones.length
      },
      { new: true }
    );

    if (!broadcastLog) {
      throw new Error('Broadcast log not found');
    }

    // Send messages
    const results = {
      sent: 0,
      failed: 0,
      failedPhones: []
    };

    if (channels.includes('whatsapp')) {
      for (const phone of eligiblePhones) {
        try {
          const result = await sendWhatsappMessage(phone, content);
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.failedPhones.push({
              phone,
              error: result.error
            });
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.failedPhones.push({
            phone,
            error: error.message
          });
        }
      }
    }

    // Update broadcast log with results
    const finalStats = {
      totalRecipients: eligiblePhones.length,
      sent: results.sent,
      failed: results.failed
    };

    await BroadcastLog.findByIdAndUpdate(
      broadcastLogId,
      {
        status: results.failed === 0 ? 'sent' : 'failed',
        completedAt: new Date(),
        'stats': finalStats,
        errors: results.failedPhones
      }
    );

    return {
      success: results.failed === 0,
      stats: finalStats,
      errors: results.failedPhones
    };
  } catch (error) {
    console.error('Broadcast error:', error);
    throw error;
  }
};

/**
 * Sync customer preferences from orders
 * @param {string} branchId - Branch ID
 */
const syncCustomerPreferencesFromOrders = async (branchId) => {
  try {
    const orders = await Order.find({
      branch: branchId,
      customerPhone: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    for (const order of orders) {
      const phone = order.customerPhone;

      // Check if customer exists
      let customer = await CustomerPreferences.findOne({ phone });

      if (!customer) {
        // Create new customer preference
        customer = new CustomerPreferences({
          phone,
          name: order.customerName,
          branches: [branchId],
          source: 'order',
          lastSyncedAt: new Date()
        });
      } else {
        // Update existing customer
        if (!customer.branches.includes(branchId)) {
          customer.branches.push(branchId);
        }
        customer.lastSyncedAt = new Date();
      }

      // Update stats
      customer.stats.lastOrderDate = order.createdAt;
      customer.stats.totalOrders = (customer.stats.totalOrders || 0) + 1;
      customer.stats.totalSpent = (customer.stats.totalSpent || 0) + order.total;

      await customer.save();
    }

    return { success: true, synced: orders.length };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle customer opt-out
 * @param {string} phone - Phone number
 * @param {Array} channels - Channels to opt out from
 * @param {string} reason - Opt-out reason
 */
const handleOptOut = async (phone, channels = ['whatsapp'], reason = null) => {
  try {
    let preferences = await CustomerPreferences.findOne({ phone });

    if (!preferences) {
      preferences = new CustomerPreferences({
        phone,
        optedOut: true,
        optedOutAt: new Date()
      });
    } else {
      preferences.optedOut = true;
      preferences.optedOutAt = new Date();
      preferences.optedOutChannels = [...new Set([...preferences.optedOutChannels, ...channels])];
      if (reason) {
        preferences.optedOutReasons.push(reason);
      }
    }

    await preferences.save();

    return { success: true, message: 'Opted out successfully' };
  } catch (error) {
    console.error('Opt-out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle customer opt-in
 * @param {string} phone - Phone number
 * @param {Array} channels - Channels to opt in for
 * @param {Object} subscriptions - Subscription types
 */
const handleOptIn = async (phone, channels = ['whatsapp'], subscriptions = {}) => {
  try {
    let preferences = await CustomerPreferences.findOne({ phone });

    if (!preferences) {
      preferences = new CustomerPreferences({
        phone,
        optedOut: false
      });
    } else {
      preferences.optedOut = false;
    }

    // Update preferences
    channels.forEach(channel => {
      if (channel === 'whatsapp') preferences.preferences.whatsapp = true;
      if (channel === 'sms') preferences.preferences.sms = true;
      if (channel === 'email') preferences.preferences.email = true;
    });

    // Update subscriptions
    Object.keys(subscriptions).forEach(key => {
      if (preferences.subscriptions.hasOwnProperty(key)) {
        preferences.subscriptions[key] = subscriptions[key];
      }
    });

    await preferences.save();

    return { success: true, message: 'Opted in successfully' };
  } catch (error) {
    console.error('Opt-in error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsappBill,
  sendWhatsappMessage,
  getEligibleCustomers,
  sendBroadcast,
  syncCustomerPreferencesFromOrders,
  handleOptOut,
  handleOptIn
};
