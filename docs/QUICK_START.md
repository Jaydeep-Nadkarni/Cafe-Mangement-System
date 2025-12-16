# MongoDB Setup - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install MongoDB (One-time)

**Windows:**
- Download: https://www.mongodb.com/try/download/community
- Install with default settings
- MongoDB runs automatically as a Windows Service

**Mac (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Step 2: Install Dependencies

```bash
cd server
npm install
```

### Step 3: Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

For **local MongoDB** (default):
```env
MONGODB_URI=mongodb://localhost:27017/cafe_management
```

For **MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/cafe_management
```

### Step 4: Start Server

```bash
npm run dev
```

You should see:
```
MongoDB connected: localhost:27017
Server running on: http://localhost:5000
```

## 📚 Model Reference

**Quick Access:** All 8 models are ready to use:

```javascript
const { Admin, Branch, Table, MenuItem, Order, Coupon, GameSession, Payment } = require('./models');

// Example: Create a menu item
await MenuItem.create({
  name: 'Espresso',
  category: 'coffee',
  price: 3.99
});

// Example: Find all orders
const orders = await Order.find({ status: 'pending' });
```

## 🔍 Check Database Connection

In Node.js REPL:
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/cafe_management')
  .then(() => console.log('Connected!'))
  .catch(err => console.log('Error:', err));
```

## 📊 View Your Database

### Using MongoDB Compass (GUI):
1. Download: https://www.mongodb.com/products/compass
2. Connect to `mongodb://localhost:27017`
3. Browse collections visually

### Using MongoDB CLI:
```bash
mongosh

# Inside mongosh:
use cafe_management
db.collection_names()
db.admins.find()
```

## 🚀 First API Example

Add this to `index.js` routes:

```javascript
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## ❌ Troubleshooting

### "MongoDB connection failed"
- Is MongoDB running? Check: `mongod --version`
- Start MongoDB: `mongod` (or `brew services start mongodb-community` on Mac)

### "Cannot find module 'mongoose'"
```bash
npm install mongoose
```

### "ECONNREFUSED 127.0.0.1:27017"
MongoDB isn't running. Start it:
- **Windows:** Check Services app or run `mongod`
- **Mac:** `brew services start mongodb-community`
- **Linux:** `sudo systemctl start mongod`

## 📖 Full Documentation

See `DATABASE.md` for:
- Complete field descriptions
- Query examples
- Best practices
- Advanced usage

## ✅ Verify Setup

Run this test:

```bash
node -e "
const { connectDB } = require('./config/database');
connectDB().then(() => {
  console.log('✅ Database connection successful!');
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
"
```

---

**You're all set!** Your MongoDB and Mongoose models are ready to use. 🎉

Next: Start building API routes using the models.
