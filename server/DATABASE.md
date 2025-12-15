# MongoDB Setup & Mongoose Models Documentation

## Overview

This document describes the MongoDB database setup and Mongoose models for the Cafe Management System.

## Installation

### 1. Install MongoDB

#### On Windows:
- Download from [MongoDB Community Download](https://www.mongodb.com/try/download/community)
- Run the installer and follow the setup wizard
- MongoDB will install as a Windows Service and start automatically

#### Using MongoDB Atlas (Cloud):
- Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get your connection string
- Update `MONGODB_URI` in your `.env` file

### 2. Install Dependencies

```bash
npm install mongoose
```

This has already been added to `package.json`.

### 3. Environment Configuration

Update your `.env` file with the MongoDB connection string:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/cafe_management

# OR MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cafe_management
```

## Database Models

### 1. **Admin**
User accounts for system administrators and managers.

**Fields:**
- `username` (String, unique, required) - Admin username
- `email` (String, unique, required) - Admin email address
- `password` (String, required) - Hashed password
- `role` (String, enum) - super_admin, admin, manager
- `isActive` (Boolean) - Account status
- `lastLogin` (Date) - Last login timestamp
- `permissions` (Array) - Array of permission strings
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `email` - For quick lookup by email
- `username` - For quick lookup by username

### 2. **Branch**
Physical cafe locations/branches.

**Fields:**
- `name` (String, required) - Branch name
- `address` (Object) - Street, city, state, zipCode, country
- `phone` (String, required) - Contact phone
- `email` (String) - Branch email
- `manager` (ObjectId, ref: Admin) - Branch manager
- `totalTables` (Number) - Number of tables in branch
- `isActive` (Boolean) - Branch status
- `operatingHours` (Object) - Opening and closing times
- `coordinates` (Object) - Latitude and longitude for maps
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `name` - For quick lookup by name
- `isActive` - For filtering active branches
- `manager` - For finding branches by manager

### 3. **Table**
Dining tables in each branch.

**Fields:**
- `tableNumber` (Number, required) - Table identifier
- `branch` (ObjectId, ref: Branch, required) - Associated branch
- `capacity` (Number, required) - Seating capacity (1-20)
- `location` (String, enum) - indoor, outdoor, counter
- `status` (String, enum) - available, occupied, reserved, maintenance
- `currentOrder` (ObjectId, ref: Order) - Current active order
- `qrCode` (String) - QR code for table ordering
- `notes` (String) - Additional notes about the table
- `isActive` (Boolean) - Table status
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `branch` + `tableNumber` - Unique combination per branch
- `branch` + `status` - For finding available tables

### 4. **MenuItem**
Menu items available for ordering.

**Fields:**
- `name` (String, required) - Item name
- `description` (String) - Item description
- `category` (String, enum) - coffee, tea, pastry, sandwich, dessert, beverage, snack, special
- `price` (Number, required) - Selling price
- `costPrice` (Number) - Cost to cafe
- `image` (String) - Image URL
- `isVegetarian` (Boolean) - Dietary info
- `isVegan` (Boolean) - Dietary info
- `isSpicy` (Boolean) - Spice level indicator
- `allergies` (Array) - Known allergens
- `ingredients` (Array) - List of ingredients
- `availabilitySchedule` (Array) - Weekly availability
- `isAvailable` (Boolean) - Current availability
- `branch` (ObjectId, ref: Branch) - Specific branch or null for all
- `popularity` (Number) - Popularity score
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `category` + `isAvailable` - For filtering
- Text search on `name` and `description`
- `branch` + `category` - For branch-specific items

### 5. **Order**
Customer orders.

**Fields:**
- `orderNumber` (String, unique, required) - Order ID (e.g., ORD-2024-001)
- `branch` (ObjectId, ref: Branch, required) - Branch where order was placed
- `table` (ObjectId, ref: Table) - Associated table (dine-in)
- `items` (Array, required) - Ordered items with quantity, price, status
- `subtotal` (Number) - Sum before tax and discount
- `tax` (Number) - Tax amount
- `discount` (Number) - Discount amount
- `coupon` (ObjectId, ref: Coupon) - Applied coupon
- `total` (Number, required) - Final total
- `status` (String, enum) - pending, in_progress, completed, cancelled
- `paymentStatus` (String, enum) - unpaid, paid, refunded
- `paymentMethod` (String, enum) - cash, card, upi, wallet
- `customerName` (String) - Customer name
- `customerPhone` (String) - Customer phone
- `notes` (String) - Special instructions
- `completedAt` (Date) - Order completion time
- `paidAt` (Date) - Payment time
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `branch` + `status` - For finding branch orders
- `table` + `status` - For table-specific orders
- `createdAt` - For sorting by date
- `paymentStatus` - For payment tracking

**Pre-save Middleware:**
- Automatically calculates subtotal and total before saving

### 6. **Coupon**
Promotional coupons and discounts.

**Fields:**
- `code` (String, unique, required) - Coupon code (e.g., "SAVE20")
- `description` (String) - Coupon description
- `discountType` (String, enum) - percentage or fixed
- `discountValue` (Number, required) - Discount amount/percentage
- `maxDiscountAmount` (Number) - Max discount cap (for percentages)
- `minOrderAmount` (Number) - Minimum order to use coupon
- `usageLimit` (Number) - Total uses allowed (null = unlimited)
- `usagePerUser` (Number) - Uses per customer
- `usageCount` (Number) - Current usage count
- `validFrom` (Date, required) - Coupon start date
- `validUntil` (Date, required) - Coupon expiry date
- `isActive` (Boolean) - Active status
- `applicableCategories` (Array) - Categories this coupon applies to
- `applicableBranches` (Array) - Branches this coupon applies to
- `createdBy` (ObjectId, ref: Admin) - Admin who created coupon
- `notes` (String) - Internal notes
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `code` - For code lookup
- `isActive` + `validFrom` + `validUntil` - For finding active coupons

### 7. **GameSession**
Game play sessions (Wordle, Search Feud, etc.).

**Fields:**
- `gameType` (String, enum) - wordle, search, puzzle, trivia
- `sessionDate` (Date, default: now) - Session date
- `branch` (ObjectId, ref: Branch) - Branch where game was played
- `playerInfo` (Object) - name, email, phone, tableNumber
- `questionsCount` (Number) - Total questions in session
- `currentQuestion` (Number) - Current question number
- `score` (Number) - Current round score
- `totalScore` (Number) - Total session score
- `status` (String, enum) - in_progress, completed, abandoned
- `correctAnswers` (Number) - Correct answer count
- `wrongAnswers` (Number) - Wrong answer count
- `timeSpent` (Number) - Time spent in seconds
- `rewardEarned` (Number) - Reward points earned
- `rewardType` (String, enum) - Type of reward given
- `rewardValue` (String) - Reward code or value
- `completedAt` (Date) - Completion time
- `answers` (Array) - Detailed answer history
- `metadata` (Mixed) - Additional game-specific data
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `gameType` + `sessionDate` - For game analytics
- `status` + `createdAt` - For finding recent games
- `branch` + `sessionDate` - For branch analytics

### 8. **Payment**
Payment transactions.

**Fields:**
- `order` (ObjectId, ref: Order, required) - Associated order
- `branch` (ObjectId, ref: Branch, required) - Branch of order
- `amount` (Number, required) - Payment amount
- `currency` (String) - INR, USD, EUR
- `paymentMethod` (String, enum) - cash, card, upi, wallet, online
- `paymentGateway` (String, enum) - razorpay, stripe, paypal, manual
- `transactionId` (String, unique) - Unique transaction identifier
- `status` (String, enum) - pending, processing, completed, failed, refunded
- `paymentReference` (Object) - Gateway-specific IDs (Razorpay, Stripe, etc.)
- `cardDetails` (Object) - Last 4 digits, card brand (if card payment)
- `upiDetails` (Object) - UPI ID (if UPI payment)
- `notes` (String) - Payment notes
- `metadata` (Mixed) - Additional payment data
- `completedAt` (Date) - Payment completion time
- `failureReason` (String) - Reason for failure
- `receipt` (Object) - Receipt URL and path
- `timestamps` - Auto-generated createdAt, updatedAt

**Indexes:**
- `order` - For order-payment lookup
- `transactionId` - For unique transaction reference
- `status` + `createdAt` - For transaction history
- `branch` + `createdAt` - For branch payment analytics

## Usage Examples

### Import Models

```javascript
const models = require('./models');
const { Admin, Branch, Order, MenuItem } = models;
```

### Create a Menu Item

```javascript
const item = await MenuItem.create({
  name: 'Cappuccino',
  category: 'coffee',
  price: 4.99,
  description: 'Creamy espresso with steamed milk',
  isAvailable: true
});
```

### Create an Order

```javascript
const order = await Order.create({
  orderNumber: 'ORD-2024-001',
  branch: branchId,
  table: tableId,
  items: [
    {
      menuItem: itemId,
      quantity: 2,
      price: 4.99,
      status: 'pending'
    }
  ],
  total: 9.98
});
```

### Query Orders

```javascript
// Find all pending orders for a branch
const pending = await Order.find({
  branch: branchId,
  status: 'pending'
}).populate('items.menuItem').populate('table');

// Find today's completed orders
const today = new Date();
today.setHours(0, 0, 0, 0);
const completed = await Order.find({
  status: 'completed',
  completedAt: { $gte: today }
}).sort({ createdAt: -1 });
```

## Best Practices

### 1. **Always Validate Data**
- Schemas include built-in validation
- Use `.save()` or `.create()` for validation

### 2. **Use Indexes Efficiently**
- Indexes are pre-configured for common queries
- Don't create duplicate indexes

### 3. **Populate References**
- Use `.populate()` when fetching related data
- Be specific about fields needed

### 4. **Error Handling**
```javascript
try {
  const item = await MenuItem.create(data);
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error
  }
}
```

### 5. **Pagination**
```javascript
const page = 1;
const limit = 10;
const items = await MenuItem.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });
```

## Backup and Restore

### MongoDB Local Backup
```bash
mongodump --db cafe_management --out ./backup
```

### MongoDB Local Restore
```bash
mongorestore --db cafe_management ./backup/cafe_management
```

### MongoDB Atlas Backup
- Enable automatic backups in Atlas console
- Use Atlas UI to restore snapshots

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify firewall/network settings

### Validation Errors
- Check schema requirements in model files
- Ensure required fields are provided
- Verify enum values are correct

### Performance Issues
- Check indexes are created: `db.collection.getIndexes()`
- Analyze slow queries with MongoDB Profiler
- Consider adding more indexes for common queries

---

**Last Updated:** December 2024
