const mongoose = require('mongoose');
const orderService = require('./server/services/orderService');
const MenuItem = require('./server/models/MenuItem');
const Coupon = require('./server/models/Coupon');

// Mock data for testing
const mockMenuItem = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Coffee',
  price: 5.00,
  category: 'coffee'
};

const mockCoupon = {
  code: 'TEST10',
  discountType: 'percentage',
  discountValue: 10,
  isActive: true,
  expiryDate: new Date(Date.now() + 86400000) // Tomorrow
};

async function testOrderCalculation() {
  console.log('Testing Order Calculation...');

  // Mock MenuItem.findById
  MenuItem.findById = async (id) => {
    if (id.toString() === mockMenuItem._id.toString()) return mockMenuItem;
    return null;
  };

  // Mock Coupon.findOne
  Coupon.findOne = async (query) => {
    if (query.code === 'TEST10') return mockCoupon;
    return null;
  };

  try {
    const items = [
      { menuItemId: mockMenuItem._id, quantity: 2 }
    ];

    console.log('1. Testing basic calculation...');
    const result1 = await orderService.calculateOrderTotals(items);
    console.log('Subtotal:', result1.subtotal); // Should be 10
    console.log('Tax:', result1.tax); // Should be 1 (10%)
    console.log('Total:', result1.total); // Should be 11

    console.log('\n2. Testing coupon calculation...');
    const result2 = await orderService.calculateOrderTotals(items, 'TEST10');
    console.log('Subtotal:', result2.subtotal); // 10
    console.log('Discount:', result2.discount); // 1 (10% of 10)
    console.log('Tax:', result2.tax); // 0.9 (10% of 9)
    console.log('Total:', result2.total); // 9.9

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOrderCalculation();
