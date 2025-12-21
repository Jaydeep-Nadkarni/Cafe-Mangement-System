# Session-Based Billing Implementation Checklist

## ✅ Backend Implementation

### Database Schema Updates
- [x] Added `sessionId` field to Order model
  - Type: String, indexed
  - Used to group orders from same session

- [x] Added `sessionPerson` field to Order model
  - Type: String
  - Tracks which person/customer the order belongs to

- [x] Added `orderType` field to Order model
  - Type: Enum ['pay_later', 'pay_now']
  - Determines auto-merge behavior

### Order Controller Updates
- [x] Updated `createOrder()` function
  - Handles Pay Later scenario: auto-merge into active session
  - Handles Pay Now scenario: merge only if same person
  - Generates sessionId for new sessions
  - Sets sessionPerson from request

- [x] Session Detection Logic
  ```javascript
  // Pay Later: Find any unpaid order with pay_later type
  existingOrder = await Order.findOne({
    table: tableId,
    status: { $nin: ['closed', 'cancelled'] },
    paymentStatus: 'unpaid',
    orderType: 'pay_later'
  })
  
  // Pay Now: Find unpaid order with same person
  existingOrder = await Order.findOne({
    table: tableId,
    sessionPerson: sessionPerson,
    status: { $nin: ['closed', 'cancelled'] },
    paymentStatus: 'unpaid',
    orderType: 'pay_now'
  })
  ```

### API Endpoints Updated
- [x] POST `/api/orders` - Create Order
  - New parameters: `sessionPerson`, `orderType`
  - Default `orderType`: 'pay_later'

### Existing Features Preserved
- [x] POST `/api/orders/merge` - Manual merge still works
  - Can merge any orders regardless of session
  - Works for both pay_later and pay_now orders
- [x] Table session stats tracking
- [x] Real-time socket events
- [x] Statistics delta calculations

---

## ✅ Frontend Implementation

### Orders Component Updates (`Orders.jsx`)
- [x] Updated grouping logic
  - Changed from table-based to session-based grouping
  - Group key: `${table._id}-${sessionId}`

- [x] Updated display structure
  - Shows combined session bill
  - Displays order count with session person name
  - Shows orderType badge (Pay Now/Pay Later)

- [x] Enhanced bill display
  - Main bill shows total amount
  - Expandable list of individual orders if multiple
  - Paid vs Unpaid amounts separated
  - Click opens the main order details

- [x] Visual improvements
  - Different background colors for pay now vs pay later
  - Shows paid/unpaid status for each order
  - Session person name displayed prominently

### Data Structure in Frontend
```javascript
// Group object structure
{
  table: { ... },
  sessionId: "table-123-001",
  sessionPerson: "Alice",
  orderType: "pay_later",
  orders: [ ... ],              // Array of orders in session
  mainOrder: { ... },           // Primary order (first created)
  totalAmount: 850,             // Combined total
  paidAmount: 300,              // Amount already paid
  unpaidAmount: 550,            // Amount pending
  lastActivity: Date
}
```

---

## ✅ Features Summary

### Pay Later Orders
- [x] Automatic merging of subsequent orders
- [x] Single combined bill shown
- [x] Can add items anytime before payment
- [x] All items tracked under one session

### Pay Now Orders
- [x] Separate bills for different customers
- [x] Same customer orders auto-merge
- [x] Different customers shown as separate bills
- [x] Can manually merge before payment

### Merge Feature
- [x] Works for all orders
- [x] Combines items and recalculates totals
- [x] Preserves audit trail
- [x] Source orders marked as merged

### Session Tracking
- [x] Session ID identifies groups of orders
- [x] Session person tracks customer name
- [x] Session start time on table
- [x] Session stats (total, paid, unpaid)

---

## 📊 Database Indexes

```javascript
// Order model - new indexes for session queries
sessionId: 1                    // Find orders in same session
{ table: 1, orderType: 1 }      // Find orders by table and type
{ table: 1, sessionPerson: 1 }  // Find orders by person
```

---

## 🔄 Data Migration (if needed)

For existing orders without session fields:
```javascript
// Set default sessionId for orders without one
db.orders.updateMany(
  { sessionId: { $exists: false } },
  { $set: { sessionId: null } }
)

// Set default orderType
db.orders.updateMany(
  { orderType: { $exists: false } },
  { $set: { orderType: 'pay_later' } }
)

// Set default sessionPerson
db.orders.updateMany(
  { sessionPerson: { $exists: false } },
  { $set: { sessionPerson: 'Guest' } }
)
```

---

## 🧪 Testing Scenarios

### Test 1: Pay Later - Auto Merge
```
Setup: Order creation enabled for Pay Later
Step 1: Create order 1 at Table 5 → ₹300
Step 2: Create order 2 at Table 5 → ₹250
Expected: Single order showing ₹550
Verify: Group displays as one combined bill
```

### Test 2: Pay Now - Different Customers
```
Setup: Order creation enabled for Pay Now
Step 1: Create order at Table 6, Person: "Alice" → ₹300
Step 2: Create order at Table 6, Person: "Bob" → ₹250
Expected: Two separate groups visible
Verify: Alice's bill: ₹300, Bob's bill: ₹250
```

### Test 3: Pay Now - Same Customer
```
Setup: Order creation enabled for Pay Now
Step 1: Create order at Table 7, Person: "Charlie" → ₹300
Step 2: Create order at Table 7, Person: "Charlie" → ₹200
Expected: Single combined group showing ₹500
Verify: Only one bill for Charlie
```

### Test 4: Split Payments
```
Setup: Mix of pay_later and pay_now orders
Step 1: Create order 1 (Pay Later) → ₹300
Step 2: Create order 2 (Pay Later) → ₹250
Step 3: Pay order 1 → ₹300
Expected: Bill shows Paid: ₹300, Unpaid: ₹250
Verify: Amounts tracked correctly
```

### Test 5: Manual Merge
```
Setup: Two pay_now orders from different people
Step 1: Create order A (Person: "X") → ₹300
Step 2: Create order B (Person: "Y") → ₹250
Step 3: Click Merge, select both orders
Expected: Combined into single order → ₹550
Verify: Bill displays correctly, merge audit logged
```

---

## 📋 Deployment Checklist

- [ ] Database migrations run (add new fields)
- [ ] Backend code deployed
- [ ] Frontend code deployed
- [ ] Clear browser cache to load new UI
- [ ] Test all scenarios with test data
- [ ] Verify socket events work with new grouping
- [ ] Check that analytics still calculate correctly
- [ ] Verify merge feature still works
- [ ] Test on mobile and desktop
- [ ] Monitor error logs for any schema validation issues

---

## 🐛 Common Issues & Solutions

### Issue 1: Orders not showing in group
**Cause**: sessionId is null
**Solution**: Ensure orderType is set in create request, or check database for existing orders

### Issue 2: Merge fails with validation error
**Cause**: Items missing subdocument _id
**Solution**: Already fixed in previous update - ensure latest code deployed

### Issue 3: Session stats not updating
**Cause**: Table needs refresh
**Solution**: Clear sessionStats in admin panel, next order will recalculate

### Issue 4: Frontend shows multiple bills for same session
**Cause**: sessionId mismatch
**Solution**: Check that grouping logic uses correct sessionId field

---

## 📚 Documentation Files

- [SESSION_BILLING_GUIDE.md](SESSION_BILLING_GUIDE.md) - Complete guide with examples
- [ORDER_LIFECYCLE.md](ORDER_LIFECYCLE.md) - Order status flows
- [ORDER_MERGE_FEATURE.md](ORDER_MERGE_FEATURE.md) - Merge details
- This file - Implementation checklist

---

## ✨ Benefits

✅ Clean bill grouping - customers see one bill per session  
✅ Flexible billing - supports both pay-later and pay-now models  
✅ Easy to track - session ID links all related orders  
✅ Customer names - know who ordered what  
✅ Manual override - can merge/split anytime  
✅ Audit trail - original order numbers preserved  

---

**Status**: Implementation Complete ✅  
**Last Updated**: December 21, 2025  
**Version**: 1.0
