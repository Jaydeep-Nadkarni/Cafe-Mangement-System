# Session-Based Billing System - Complete Guide

## Overview
The system now implements advanced session management to handle both **Pay Later** and **Pay Now** scenarios, allowing flexible billing while maintaining clean bill grouping.

## Key Concepts

### Active Session
- **Definition**: A session is active from the moment of first order until the bill is paid or the table becomes available again
- **Same Session**: Same person, same table during the same time period
- **Scope**: Under one session, any number of orders can be created and combined

### Session Types

#### 1. Pay Later (`pay_later`)
- **Behavior**: Orders automatically merge into the active session order
- **Process**:
  1. Customer orders → creates session order (or merges if one exists)
  2. Customer orders again → **automatically combines** with existing order
  3. Process repeats until payment
  4. Bill shows as **ONE combined order** with all items

- **Bill Display**:
  ```
  Table 5 - Pay Later Session
  3 Orders (Table Order)
  
  Combined Session Bill: ₹850
  ├─ Order #ORD-001 (₹300)
  ├─ Order #ORD-002 (₹250)
  └─ Order #ORD-003 (₹300)
  ```

#### 2. Pay Now (`pay_now`)
- **Behavior**: Creates separate orders unless it's the same session/person
- **Process**:
  1. Customer orders with name "Alice" → creates order A
  2. **Same person** orders again → **merges** into order A
  3. **Different person** "Bob" orders → creates **separate** order B
  4. Orders can be merged later if needed

- **Bill Display**:
  ```
  Table 5 - Pay Now Session (Alice)
  1 Order (Alice) - ₹550
  
  ___
  
  Table 5 - Pay Now Session (Bob)
  1 Order (Bob) - ₹300
  
  [Can be merged with Merge feature]
  ```

## Database Structure

### Order Model Fields

#### Session Management
```javascript
{
  sessionId: String,           // Groups orders from same session
  sessionPerson: String,       // Person/customer name for this part of session
  orderType: 'pay_later' | 'pay_now'  // Determines merge behavior
}
```

### Example Orders

**Pay Later - Single Session:**
```javascript
Order 1: { sessionId: "table-123-001", sessionPerson: "Table 5", orderType: "pay_later" }
Order 2: { sessionId: "table-123-001", sessionPerson: "Table 5", orderType: "pay_later" }
// Both shown as ONE combined bill
```

**Pay Now - Multiple Customers:**
```javascript
Order 1: { sessionId: "table-123-001", sessionPerson: "Alice", orderType: "pay_now" }
Order 2: { sessionId: "table-123-002", sessionPerson: "Bob", orderType: "pay_now" }
// Shown as two separate bills
```

## API Usage

### Create Order with Session Type

#### Pay Later (Default)
```bash
POST /api/orders
{
  "tableId": "123456",
  "items": [...],
  "sessionPerson": "Table 5",
  "orderType": "pay_later"    # Auto-merges subsequent orders
}
```

#### Pay Now with Customer Name
```bash
POST /api/orders
{
  "tableId": "123456",
  "items": [...],
  "sessionPerson": "Alice",
  "orderType": "pay_now"      # Merges only if same person orders again
}
```

## Frontend Display Logic

### Grouping Strategy
Orders are grouped by:
1. Table ID + Session ID
2. Each group shows as ONE combined bill
3. If multiple orders in session, show summary of individual orders

### Display Components

**Single Order Session:**
- Shows combined total
- Displays "Click to view details"

**Multiple Orders Session:**
- Shows count: "3 Orders"
- Displays person/customer name
- Lists individual orders:
  - Order #ORD-001: ₹300 (Paid/Unpaid)
  - Order #ORD-002: ₹250
  - Order #ORD-003: ₹300
- Combined total: ₹850

## Flow Diagrams

### Pay Later Flow
```
Customer at Table 5
        ↓
Order 1 (Coffee) → Create Session Order 1
        ↓
Order 2 (Snack) → Merge into Session Order 1
        ↓
Order 3 (Dessert) → Merge into Session Order 1
        ↓
Bill → ONE COMBINED BILL (3 items, ₹850)
        ↓
Payment → Session ends
```

### Pay Now Flow
```
Alice at Table 5
        ↓
Order 1 (Coffee) → Create Order 1 (Alice)
        ↓
Order 2 (Snack) → Merge into Order 1 (same person)
        ↓
Bob arrives at Table 5
        ↓
Order 3 (Burger) → Create NEW Order 2 (Bob)
        ↓
Billing:
- Alice's Bill: ₹550
- Bob's Bill: ₹300
- Option to merge before payment
```

## Session Rules

### Rule 1: Same Table
- Different tables can never be in same session
- Table ID is always checked

### Rule 2: Active Session Duration
- Session starts: First order placed
- Session ends: Bill paid OR table marked available
- If paid earlier: Unless table is made available, session remains active

### Rule 3: Pay Later Auto-Merge
```javascript
if (orderType === 'pay_later') {
  if (activeUnpaidOrder exists in same table) {
    MERGE with existing order
  } else {
    CREATE new session order
  }
}
```

### Rule 4: Pay Now Conditional Merge
```javascript
if (orderType === 'pay_now') {
  if (order exists with same sessionPerson && unpaid) {
    MERGE with existing order (same person)
  } else {
    CREATE new order (different person or first order)
  }
}
```

## Merge Feature

### Manual Merge (Pay Now Orders)
If two separate pay-now orders exist for different customers:
- Click "Merge" button
- Select orders to merge
- Combines into single bill
- Can be split again if needed

### Related Endpoints
- POST `/api/orders/merge` - Merge orders
- GET `/api/orders/:id` - View order details

## Implementation Notes

### Session ID Generation
```javascript
sessionId = `${tableId}-${Date.now()}`
// Example: "507f1f77bcf86cd799439011-1703060424000"
```

### Session Person Tracking
- Defaults to "Table Order" if not provided (Pay Later)
- Defaults to "Guest" if not provided (Pay Now)
- Used to identify different customers in same table

### Paid vs Unpaid Tracking
- Unpaid orders can be merged
- Paid orders cannot be modified or merged
- Session stats track both amounts separately

## UI Changes

### Orders Component Updates
1. **Grouping**: Now groups by `sessionId` instead of table
2. **Display**: Shows "X Orders (Person Name)" instead of just count
3. **Type Badge**: Shows "Pay Now" or "Pay Later" indicator
4. **Combined View**: Click opens the main order with all items listed
5. **Amount Split**: Shows paid vs unpaid amounts separately

## Testing Scenarios

### Scenario 1: Pay Later - Single Customer
1. Create order at Table 1 (Pay Later) - ₹300
2. Create order at Table 1 (Pay Later) - ₹250
3. Expected: ONE bill showing ₹550

### Scenario 2: Pay Now - Multiple Customers
1. Create order at Table 2, Person: "Alice" (Pay Now) - ₹300
2. Create order at Table 2, Person: "Bob" (Pay Now) - ₹250
3. Expected: TWO separate bills

### Scenario 3: Pay Now - Same Customer Adds Item
1. Create order at Table 3, Person: "Charlie" (Pay Now) - ₹300
2. Create order at Table 3, Person: "Charlie" (Pay Now) - ₹200
3. Expected: ONE bill showing ₹500 (merged because same person)

### Scenario 4: Mixed Payments
1. Create order at Table 4 (Pay Later) - ₹300
2. Create order at Table 4 (Pay Later) - ₹250
3. Pay first order - ₹300
4. Expected: Bill shows ₹300 Paid + ₹250 Unpaid

## Benefits

✅ **Flexible Billing**: Supports both pay-later and pay-now customers  
✅ **Clean Interface**: Each session shown as one combined bill  
✅ **Easy Splitting**: Can easily split bills between customers  
✅ **Audit Trail**: Tracks original order numbers for accountability  
✅ **Session Tracking**: Know when sessions start and end  
✅ **Payment Status**: Easy to see paid vs unpaid amounts per session
