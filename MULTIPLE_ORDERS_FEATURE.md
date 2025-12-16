# Multiple Orders Per Table Feature

## Overview

This feature allows customers at the same table to place multiple orders that get automatically merged into a single order. Instead of creating separate orders, subsequent orders from the same table will add items to the existing active order.

## How It Works

### User Flow

1. **First Order:**
   - Customer at Table 5 scans QR code
   - Adds items to cart (Coffee, Pastry)
   - Proceeds to payment
   - Order is created and kitchen receives notification

2. **Additional Order (Same Table):**
   - Same table wants to order more items (Sandwich, Juice)
   - Customer scans QR code again
   - Adds new items to cart
   - Proceeds to payment
   - System detects existing order for Table 5
   - **Automatically adds items to existing order instead of creating new one**
   - Kitchen receives update notification

3. **Final Bill:**
   - All items ordered during the session are merged
   - Single bill shows all items
   - Single payment for entire order

## Technical Implementation

### Backend Changes (`server/routes/publicRoutes.js`)

**Before:**
```javascript
if (table.currentOrder) {
  return res.status(400).json({ message: 'Table is already occupied. Please contact staff.' });
}
```

**After:**
- Checks if table has an active order
- If yes, adds items to existing order:
  - Recalculates totals with new items
  - Updates item quantities if duplicate items are ordered
  - Combines chef notes
  - Emits `order_updated` event instead of `new_order`
- If no, creates new order as before

### Frontend Changes

**MobileNumberModal.jsx:**
- Now handles successful responses for both new and existing orders
- Includes flag `isAddedToExisting` in payment response

**PaymentSuccessPage.jsx:**
- Shows notification when items are added to existing order
- Displays message: "✓ Items have been added to your existing order"

## Benefits

1. **Better UX:** Customers don't need to worry about creating duplicate orders
2. **Kitchen Efficiency:** Single order number to track for a table
3. **Billing Simplicity:** One bill per table session, not multiple bills
4. **Real-time Updates:** Kitchen manager sees order updates in real-time
5. **Flexible Ordering:** Customers can order in waves without concerns

## Real-Time Notifications

The system emits real-time events to the branch manager:

- **New Order:** `new_order` event when first order is created
- **Order Update:** `order_updated` event when items are added to existing order

Branch managers can see these updates immediately in the Orders dashboard.

## Item Quantity Handling

When a customer orders the same item multiple times:

**First Order:**
- 2x Coffee

**Additional Order:**
- 1x Coffee

**Result:**
- 3x Coffee (quantities merged)

## Important Notes

1. **Order Status:** Once an order reaches "completed" or "paid" status, new orders cannot be added to it
2. **Table Assignment:** Items are only merged if they're for the same table
3. **Customer Info:** Customer name and phone are updated if provided on subsequent orders
4. **Chef Notes:** All chef notes are concatenated to the order

## Testing

### Scenario 1: Add to Existing Order
```
1. Table 5 orders: 2x Coffee (₹200)
2. Table 5 orders again: 1x Pastry (₹150)
Result: Single order with 2x Coffee + 1x Pastry = ₹350 (+ tax)
```

### Scenario 2: Multiple Tables
```
1. Table 5 orders: Coffee
2. Table 7 orders: Tea (creates separate order)
3. Table 5 orders: Pastry (adds to Table 5's order)
Result: Two separate orders - one for Table 5, one for Table 7
```

### Scenario 3: Different Customers at Same Table
```
Note: Subsequent orders will merge regardless of customer name
This is intentional - assumes same table = same group
```

## Future Enhancements

1. **Split Bill:** Option to split bill between customers at same table
2. **Time Windows:** Option to close order after certain time period
3. **Quantity Limits:** Prevent accidental duplicate orders
4. **Order Consolidation UI:** Show merged orders clearly in admin dashboard

## API Response Changes

**For new orders:**
```json
{
  "status": 201,
  "message": "Order created",
  "data": { /* order details */ }
}
```

**For orders added to existing:**
```json
{
  "status": 200,
  "message": "Items added to existing order",
  "data": { /* updated order details */ }
}
```
