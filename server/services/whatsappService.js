const axios = require('axios');
const FormData = require('form-data');

/**
 * Send bill via WhatsApp
 * @param {string} phoneNumber - Recipient phone number
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} filename - Name of the file
 */
const sendWhatsappBill = async (phoneNumber, pdfBuffer, filename = 'bill.pdf') => {
  try {
    // Check if WhatsApp API is configured
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiUrl || !apiKey) {
      console.warn('WhatsApp API not configured. Skipping message send.');
      return { success: false, message: 'WhatsApp API not configured' };
    }

    const form = new FormData();
    form.append('phone', phoneNumber);
    form.append('file', pdfBuffer, { filename });
    form.append('caption', 'Here is your bill from Cafe Management System.');

    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp Service Error:', error.message);
    // Don't throw, just return failure so the main flow doesn't crash
    return { 
      success: false, 
      error: error.response ? error.response.data : error.message 
    };
  }
};

module.exports = {
  sendWhatsappBill
};
