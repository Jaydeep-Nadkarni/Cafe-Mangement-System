# Practical MongoDB & Mongoose Examples

## Import Models

```javascript
const { 
  Admin, 
  Branch, 
  Table, 
  MenuItem, 
  Order, 
  Coupon, 
  GameSession, 
  Payment 
} = require('./models');
```

## Common Queries

### 1. Menu Items

```javascript
// Get all coffee items
const coffees = await MenuItem.find({ category: 'coffee', isAvailable: true });

// Search menu items
const results = await MenuItem.find({ $text: { $search: 'espresso cappuccino' } });

// Get items by category with count
const items = await MenuItem.find({ category: 'pastry' }).limit(10);

// Popular items
const popular = await MenuItem.find().sort({ popularity: -1 }).limit(5);
```

### 2. Orders

```javascript
// Get pending orders for a branch
const pending = await Order.find({ 
  branch: branchId, 
  status: 'pending' 
}).populate('items.menuItem').populate('table');

// Today's sales
const today = new Date();
today.setHours(0, 0, 0, 0);
const sales = await Order.find({
  createdAt: { $gte: today },
  paymentStatus: 'paid'
}).sort({ createdAt: -1 });

// Total revenue this month
const monthRevenue = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
      paymentStatus: 'paid'
    }
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: '$total' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$total' }
    }
  }
]);

// Orders by table
const tableOrders = await Order.find({ table: tableId })
  .sort({ createdAt: -1 })
  .limit(20);
```

### 3. Tables

```javascript
// Find available tables
const available = await Table.find({ 
  branch: branchId, 
  status: 'available' 
});

// Get occupied tables with current orders
const occupied = await Table.find({ 
  branch: branchId, 
  status: 'occupied' 
}).populate('currentOrder');

// Table occupancy analytics
const occupancy = await Table.aggregate([
  { $match: { branch: branchId } },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  }
]);
```

### 4. Coupons

```javascript
// Get active coupons
const active = await Coupon.find({
  isActive: true,
  validFrom: { $lte: new Date() },
  validUntil: { $gte: new Date() }
});

// Find coupon by code
const coupon = await Coupon.findOne({ code: 'SAVE20' });

// Check if coupon is valid and applicable
if (coupon && coupon.validFrom <= new Date() && coupon.validUntil >= new Date()) {
  const discount = coupon.discountType === 'percentage' 
    ? (orderTotal * coupon.discountValue) / 100 
    : coupon.discountValue;
  
  if (coupon.maxDiscountAmount) {
    return Math.min(discount, coupon.maxDiscountAmount);
  }
  return discount;
}
```

### 5. Payments

```javascript
// Get pending payments
const pending = await Payment.find({ status: 'pending' }).populate('order');

// Find payment by transaction ID
const payment = await Payment.findOne({ transactionId: razorpayPaymentId });

// Payment analytics for a period
const analytics = await Payment.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }
  },
  {
    $group: {
      _id: '$paymentMethod',
      count: { $sum: 1 },
      total: { $sum: '$amount' },
      avg: { $avg: '$amount' }
    }
  }
]);

// Failed payments for review
const failed = await Payment.find({ status: 'failed' })
  .sort({ createdAt: -1 })
  .limit(10)
  .populate('order');
```

### 6. Game Sessions

```javascript
// Get today's game sessions
const today = new Date();
today.setHours(0, 0, 0, 0);
const sessions = await GameSession.find({
  sessionDate: { $gte: today },
  status: 'completed'
}).sort({ totalScore: -1 });

// Top scorers this week
const week = new Date();
week.setDate(week.getDate() - 7);
const topScores = await GameSession.find({
  createdAt: { $gte: week },
  status: 'completed'
}).sort({ totalScore: -1 }).limit(10);

// Game statistics
const stats = await GameSession.aggregate([
  { $match: { gameType: 'wordle', status: 'completed' } },
  {
    $group: {
      _id: null,
      totalSessions: { $sum: 1 },
      avgScore: { $avg: '$totalScore' },
      avgTime: { $avg: '$timeSpent' },
      totalRewards: { $sum: '$rewardEarned' }
    }
  }
]);
```

### 7. Branches

```javascript
// Get all active branches with manager info
const branches = await Branch.find({ isActive: true })
  .populate('manager', 'username email');

// Branch performance
const performance = await Order.aggregate([
  {
    $group: {
      _id: '$branch',
      orderCount: { $sum: 1 },
      totalRevenue: { $sum: '$total' },
      avgOrderValue: { $avg: '$total' }
    }
  },
  {
    $lookup: {
      from: 'branches',
      localField: '_id',
      foreignField: '_id',
      as: 'branchInfo'
    }
  }
]);
```

### 8. Admins

```javascript
// Get active admins
const admins = await Admin.find({ isActive: true });

// Find admin by email
const admin = await Admin.findOne({ email: 'admin@cafe.com' }).select('+password');

// Update last login
await Admin.findByIdAndUpdate(adminId, { lastLogin: new Date() });
```

## Create Operations

```javascript
// Create a new branch
const branch = await Branch.create({
  name: 'Downtown Cafe',
  phone: '1234567890',
  email: 'downtown@cafe.com',
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105'
  },
  operatingHours: {
    openingTime: '06:00',
    closingTime: '22:00'
  }
});

// Create a table
const table = await Table.create({
  tableNumber: 1,
  branch: branch._id,
  capacity: 4,
  location: 'indoor',
  qrCode: 'https://qr.cafe/table/1'
});

// Create a menu item
const item = await MenuItem.create({
  name: 'Cappuccino',
  description: 'Espresso with steamed milk',
  category: 'coffee',
  price: 4.99,
  costPrice: 1.50,
  isAvailable: true,
  branch: branch._id
});

// Create an order
const order = await Order.create({
  orderNumber: `ORD-${Date.now()}`,
  branch: branch._id,
  table: table._id,
  items: [
    {
      menuItem: item._id,
      quantity: 2,
      price: 4.99,
      specialInstructions: 'Extra hot'
    }
  ],
  subtotal: 9.98,
  tax: 0.80,
  discount: 0,
  total: 10.78
});

// Create a coupon
const coupon = await Coupon.create({
  code: 'SAVE20',
  description: '20% off on all beverages',
  discountType: 'percentage',
  discountValue: 20,
  minOrderAmount: 10,
  usageLimit: 100,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  applicableCategories: ['coffee', 'tea', 'beverage'],
  createdBy: adminId
});

// Record a payment
const payment = await Payment.create({
  order: order._id,
  branch: branch._id,
  amount: order.total,
  currency: 'INR',
  paymentMethod: 'card',
  paymentGateway: 'razorpay',
  status: 'completed',
  transactionId: 'txn_123456789',
  completedAt: new Date()
});

// Record a game session
const session = await GameSession.create({
  gameType: 'wordle',
  branch: branch._id,
  playerInfo: {
    name: 'John Doe',
    tableNumber: 1
  },
  questionsCount: 5,
  score: 250,
  totalScore: 250,
  status: 'completed',
  correctAnswers: 5,
  rewardEarned: 50,
  rewardType: 'discount_coupon',
  completedAt: new Date()
});
```

## Update Operations

```javascript
// Update menu item price
await MenuItem.findByIdAndUpdate(itemId, { price: 5.99 }, { new: true });

// Update order status
await Order.findByIdAndUpdate(orderId, { status: 'completed' });

// Mark table as occupied
await Table.findByIdAndUpdate(tableId, { 
  status: 'occupied',
  currentOrder: orderId 
});

// Increment coupon usage
await Coupon.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } });

// Update payment status
await Payment.findByIdAndUpdate(paymentId, { 
  status: 'completed',
  completedAt: new Date()
});
```

## Delete Operations

```javascript
// Soft delete (mark inactive)
await MenuItem.findByIdAndUpdate(itemId, { isAvailable: false });

// Hard delete
await Coupon.findByIdAndDelete(couponId);

// Delete old game sessions
await GameSession.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

## Aggregation Pipelines

```javascript
// Sales by category
const categorySales = await Order.aggregate([
  { $unwind: '$items' },
  {
    $lookup: {
      from: 'menuitems',
      localField: 'items.menuItem',
      foreignField: '_id',
      as: 'menuItem'
    }
  },
  { $unwind: '$menuItem' },
  {
    $group: {
      _id: '$menuItem.category',
      totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
      quantity: { $sum: '$items.quantity' }
    }
  },
  { $sort: { totalSales: -1 } }
]);

// Customer order history
const customerOrders = await Order.aggregate([
  { $match: { customerPhone: '1234567890' } },
  {
    $lookup: {
      from: 'payments',
      localField: '_id',
      foreignField: 'order',
      as: 'payment'
    }
  },
  { $sort: { createdAt: -1 } }
]);
```

## Error Handling

```javascript
try {
  const item = await MenuItem.create({
    name: 'Test',
    // Missing required fields
  });
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
    console.log(error.errors);
  } else if (error.code === 11000) {
    // Handle duplicate key error
    console.log('Duplicate entry');
  } else {
    console.error(error);
  }
}
```

---

These examples cover the most common operations. For more details, refer to the `DATABASE.md` file.
