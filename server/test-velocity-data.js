const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect('mongodb://localhost/cafe_management').then(async () => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    
    console.log('=== Data Check ===');
    console.log('Current time:', now);
    console.log('Start of today:', start);
    
    // Check total orders
    const totalOrders = await Order.countDocuments({});
    console.log('Total orders in DB:', totalOrders);
    
    // Check orders created today
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: start, $lte: now }
    });
    console.log('Orders created today:', ordersToday);
    
    // Check paid orders
    const paidOrders = await Order.countDocuments({
      paymentStatus: 'paid'
    });
    console.log('Total paid orders:', paidOrders);
    
    // Check paid orders today
    const paidOrdersToday = await Order.countDocuments({
      paymentStatus: 'paid',
      createdAt: { $gte: start, $lte: now }
    });
    console.log('Paid orders today:', paidOrdersToday);
    
    // Get a sample order
    const sampleOrder = await Order.findOne({}).limit(1);
    if (sampleOrder) {
      console.log('\n=== Sample Order ===');
      console.log('ID:', sampleOrder._id);
      console.log('Branch:', sampleOrder.branch);
      console.log('Payment Status:', sampleOrder.paymentStatus);
      console.log('Items count:', sampleOrder.items?.length || 0);
      console.log('Created At:', sampleOrder.createdAt);
    }
    
    // Check menu items
    const MenuItem = require('./models/MenuItem');
    const menuItemCount = await MenuItem.countDocuments({});
    console.log('\nTotal menu items:', menuItemCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}).catch(error => {
  console.error('DB Connection Error:', error.message);
  process.exit(1);
});
