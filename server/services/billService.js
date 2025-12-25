const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(val);
};

/**
 * Generate a thermal bill PDF
 * @param {Object} order - Order object with items, totals, etc.
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateThermalBill = (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Thermal printer width is usually 58mm or 80mm. 
      // 58mm is approx 164 points, 80mm is approx 226 points.
      // Let's go with a standard 80mm width (approx 226pt) and variable height.
      const doc = new PDFDocument({
        size: [226, 800], // Width 80mm, Height variable (will auto-expand if needed but pdfkit needs a height)
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header ---
      doc.font('Helvetica-Bold').fontSize(12).text('Cafe Management System', { align: 'center' });
      doc.fontSize(8).text('123 Coffee Street, Tech City', { align: 'center' });
      doc.text('Tel: +1 234 567 890', { align: 'center' });
      doc.moveDown();

      // --- Order Info ---
      doc.font('Helvetica').fontSize(8);
      doc.text(`Order #: ${order._id.toString().slice(-6).toUpperCase()}`);
      if (order.isSplitBill) {
        doc.font('Helvetica-Bold').text(`SPLIT BILL: ${order.splitIndex} of ${order.totalSplits}`);
      }
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      doc.text(`Date: ${day}-${month}-${year} ${hours}:${minutes}`);
      if (order.table) {
        // Assuming table is populated or just an ID
        doc.text(`Table: ${order.table.tableNumber || order.table}`);
      }
      doc.text('----------------------------------------', { align: 'center' });

      // --- Items ---
      doc.font('Helvetica-Bold').text('Item', { continued: true });
      doc.text('Qty', { align: 'right' }); // Simple layout
      // A better layout for thermal:
      // Item Name x Qty   Price
      
      doc.font('Helvetica').fontSize(8);

      // Group items for cleaner bill
      const groupedItems = {};
      order.items.forEach(item => {
        const key = `${item.menuItem._id}-${item.price}`; // Group by ID and Price
        if (!groupedItems[key]) {
          groupedItems[key] = {
            name: item.menuItem.name || 'Unknown Item',
            quantity: 0,
            price: item.price
          };
        }
        groupedItems[key].quantity += item.quantity;
      });

      Object.values(groupedItems).forEach(item => {
        const price = formatCurrency(item.price * item.quantity);
        doc.text(`${item.name} x ${item.quantity}`, { continued: true });
        doc.text(price, { align: 'right' });
      });

      doc.text('----------------------------------------', { align: 'center' });

      // --- Totals ---
      doc.font('Helvetica-Bold');
      doc.text(`Subtotal:`, { continued: true });
      doc.text(formatCurrency(order.subtotal), { align: 'right' });

      if (order.discount > 0) {
        doc.text(`Discount:`, { continued: true });
        doc.text(`-${formatCurrency(order.discount)}`, { align: 'right' });
      }

      doc.text(`Tax:`, { continued: true });
      doc.text(formatCurrency(order.tax), { align: 'right' });

      doc.fontSize(10).text(`TOTAL:`, { continued: true });
      doc.text(formatCurrency(order.total), { align: 'right' });

      doc.moveDown();
      doc.fontSize(8).font('Helvetica').text('Thank you for visiting!', { align: 'center' });
      doc.text('Please come again.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate multiple split bill PDFs
 * @param {Object} order - Original order
 * @param {String} splitType - 'equal' or 'item'
 * @param {Number} splitCount - Number of splits for 'equal'
 * @param {Array} splitItems - Array of item arrays for 'item' split
 * @returns {Promise<Array>} - Array of PDF buffers
 */
const generateSplitBills = async (order, splitType, splitCount = 2, splitItems = []) => {
  const bills = [];

  if (splitType === 'equal') {
    const amountPerPerson = order.total / splitCount;
    const subtotalPerPerson = order.subtotal / splitCount;
    const taxPerPerson = order.tax / splitCount;
    const discountPerPerson = order.discount / splitCount;

    for (let i = 1; i <= splitCount; i++) {
      const splitOrder = {
        ...order,
        _id: `${order._id}-split-${i}`,
        subtotal: subtotalPerPerson,
        tax: taxPerPerson,
        discount: discountPerPerson,
        total: amountPerPerson,
        isSplitBill: true,
        splitIndex: i,
        totalSplits: splitCount
      };
      const buffer = await generateThermalBill(splitOrder);
      bills.push(buffer);
    }
  } else if (splitType === 'item') {
    for (let i = 0; i < splitItems.length; i++) {
      const items = splitItems[i];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const ratio = order.subtotal > 0 ? subtotal / order.subtotal : 0;
      const tax = order.tax * ratio;
      const discount = order.discount * ratio;
      const total = subtotal + tax - discount;

      const splitOrder = {
        ...order,
        _id: `${order._id}-split-${i + 1}`,
        items,
        subtotal,
        tax,
        discount,
        total,
        isSplitBill: true,
        splitIndex: i + 1,
        totalSplits: splitItems.length
      };
      const buffer = await generateThermalBill(splitOrder);
      bills.push(buffer);
    }
  }

  return bills;
};

module.exports = {
  generateThermalBill,
  generateSplitBills
};
