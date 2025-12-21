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

module.exports = {
  sendWhatsappBill
};
