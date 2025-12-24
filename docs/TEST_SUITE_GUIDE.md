# Comprehensive Test Suite Guide

## Overview
This document provides step-by-step testing instructions for all new features and fixes implemented in the Cafe Management System.

---

## 1. Date Handling & Validation Tests

### Backend Tests (orderController.js + Order.js)

#### Test 1.1: Date Validation on Order Creation
- **Steps:**
  1. Create a new order via the Order modal
  2. Complete the order and mark as paid
  3. Check server logs for any "Invalid date" warnings
- **Expected Result:** No invalid date warnings; dates properly formatted
- **Verification:** `paidAt` field in database shows valid ISO timestamp

#### Test 1.2: Date Validation on Checkout
- **Steps:**
  1. Create and checkout an order via any payment method (cash, card, UPI)
  2. Verify the `paidAt` timestamp in the order record
  3. Check that date is consistent across database and API responses
- **Expected Result:** All dates use `new Date()` format, no `Date.now()` inconsistencies
- **Verification:** API response shows consistent date format in JSON

#### Test 1.3: Edit History Date Tracking
- **Steps:**
  1. Modify an order item (add/remove/change quantity)
  2. View edit history in order details
  3. Check all `editedAt` timestamps are valid
- **Expected Result:** All edit history dates are valid timestamps
- **Verification:** Dates are properly formatted in order audit trail

### Frontend Tests

#### Test 1.4: Date Display in UI
- **Steps:**
  1. View order list and check date/time display
  2. Open order modal and verify payment date shows correctly
  3. Check invoice for date formatting
- **Expected Result:** All dates display correctly formatted (no "Invalid Date" text)

---

## 2. Custom/Open Items Display Tests

### Test 2.1: Custom Item Creation and Display
- **Steps:**
  1. Open Orders modal
  2. Add a quick custom item with name "Custom Lassi" and price 150
  3. View order in list view
  4. Open order detail and verify custom item displays
  5. Generate and view invoice
- **Expected Result:** 
  - List view shows "Custom Lassi" (not "Unknown Item")
  - Detail view shows exact name and price
  - Invoice shows "Custom Lassi" with price ₹150
- **Files to Verify:** 
  - `Orders.jsx` line 1013: Uses `item.menuItem?.name || item.name`
  - `Invoice.jsx` line 58: Uses `item.menuItem?.name || item.name`

### Test 2.2: Multiple Custom Items
- **Steps:**
  1. Add multiple custom items with different prices to one order
  2. View in order list (should show first 3 items)
  3. Open detail and verify all custom items display correctly
- **Expected Result:** All custom items display with exact names and prices

### Test 2.3: Mix of Menu and Custom Items
- **Steps:**
  1. Add a menu item (e.g., Coffee)
  2. Add a custom item (e.g., Special Tea)
  3. View in order list and detail
- **Expected Result:** Menu items and custom items both display correctly

---

## 3. Enhanced UI Components Tests

### Test 3.1: ConfirmationModal Icon Display
- **Steps:**
  1. Trigger delete confirmation (from any component)
  2. Verify modal shows Trash2 icon
  3. Trigger cancel order confirmation
  4. Verify modal shows AlertTriangle icon
- **Expected Result:** 
  - Delete shows red trash icon
  - Cancel shows orange warning triangle icon
  - All predefined modals display correct icons
- **Files to Verify:** `ConfirmationModal.jsx` imports from lucide-react

### Test 3.2: Alert Component Icons
- **Steps:**
  1. Go to Alerts section
  2. Create different alert types (system, payment, revenue, etc.)
  3. Verify each alert type displays appropriate icon
- **Expected Result:** Each alert type has distinct, colored icon from lucide-react

### Test 3.3: Modal Size and Styling
- **Steps:**
  1. Trigger different confirmation modals
  2. Verify modal displays with proper sizing
  3. Check close button (X) is visible and functional
- **Expected Result:** Modals render with proper visual hierarchy and accessibility

---

## 4. Payment System Tests

### Test 4.1: Cash Payment Validation
- **Steps:**
  1. Create an order with total ₹500
  2. Open checkout modal
  3. Try to complete payment with amount ₹400
  4. Verify error message appears
  5. Enter correct amount ₹500 and complete
- **Expected Result:** 
  - Error shows: "Insufficient amount. Order total: ₹500, Received: ₹400"
  - Payment completes successfully with correct amount
  - Success message displays after payment

### Test 4.2: Card Payment Validation
- **Steps:**
  1. Create an order
  2. Select "Card" as payment method
  3. Complete payment
  4. Verify table status changes to "available"
- **Expected Result:** Card payment processes without requiring amount entry

### Test 4.3: Payment Method Validation
- **Steps:**
  1. Attempt checkout without selecting payment method
  2. Verify error: "Please select a payment method"
- **Expected Result:** Clear error message prevents checkout without payment method

### Test 4.4: Error Handling
- **Steps:**
  1. Monitor network tab during payment
  2. Simulate payment failure (network error)
  3. Verify error message from backend displays in modal
- **Expected Result:** 
  - Backend error messages properly displayed to user
  - "OK" button to dismiss error modal
  - Order remains in "unpaid" status

---

## 5. Table Status Transition Tests

### Test 5.1: Table Status Change on Single Order Payment
- **Steps:**
  1. Create order on Table 1 (total ₹200)
  2. Verify table shows "occupied" (red dot)
  3. Complete payment via cash
  4. Verify table status changes to "available" (green dot)
  5. Refresh page and confirm status persists
- **Expected Result:** Table 1 is available after payment
- **Verification:** Check `Table` collection in database: `status: 'available'`

### Test 5.2: Table Status with Multiple Orders
- **Steps:**
  1. Add two orders to Table 2
  2. Pay first order only (card payment)
  3. Verify table still shows "occupied"
  4. Pay second order
  5. Verify table becomes "available"
- **Expected Result:** Table remains occupied until all orders are paid

### Test 5.3: Table Status with Cash Payment (Session Closure)
- **Steps:**
  1. Add 3 orders to Table 3 (via multiple items)
  2. Pay one order with "cash" method
  3. Verify all orders marked as paid
  4. Verify table becomes immediately available
- **Expected Result:** Cash payment closes entire session and makes table available

### Test 5.4: Table Status Across Views
- **Steps:**
  1. Create order on Table 4
  2. Go to Tables view - verify status shows occupied
  3. Go to Orders view - complete payment
  4. Return to Tables view
  5. Verify Table 4 status updated to available
- **Expected Result:** Status consistent across all views after page refresh

---

## 6. Coupon System End-to-End Tests

### Test 6.1: Create Test Coupon
- **Steps:**
  1. Navigate to Admin > Coupons
  2. Click "New Coupon"
  3. Create coupon with:
     - Code: `TEST10` 
     - Description: "Test 10% Discount"
     - Type: Simple
     - Discount: 10% percentage
     - Min Order: ₹100
     - Usage Limit: 10
     - Valid Until: 30 days from now
  4. Select applicable branches
  5. Save coupon
- **Expected Result:** Coupon created and visible in list with "Active" status

### Test 6.2: Apply Test Coupon to Order
- **Steps:**
  1. Create new order with total ₹200
  2. Open order modal and look for coupon field
  3. Apply coupon `TEST10`
  4. Verify discount calculation: ₹200 × 10% = ₹20 discount
  5. Verify new total: ₹180
- **Expected Result:** 
  - Coupon applies successfully
  - Discount calculated correctly
  - Order total updated

### Test 6.3: Coupon Validation Rules
- **Steps:**
  1. Create order with total ₹50 (below ₹100 minimum)
  2. Attempt to apply `TEST10` coupon
  3. Verify error: "Minimum order amount not met"
- **Expected Result:** Coupon validation prevents invalid application

### Test 6.4: Coupon Usage Tracking
- **Steps:**
  1. Apply `TEST10` to 5 different orders
  2. Go to Coupons admin page
  3. View coupon details
  4. Verify "Used" count shows 5 / 10 usage limit
- **Expected Result:** Usage counter accurately tracks coupon application

### Test 6.5: Coupon Expiration
- **Steps:**
  1. Create coupon with expiration date = today
  2. Try to apply expired coupon to order
  3. Verify error: "Coupon has expired"
- **Expected Result:** System prevents using expired coupons

---

## 7. Search and Filter Tests

### Test 7.1: Customer Name Search
- **Steps:**
  1. Go to Orders section
  2. Enter "John" in Customer Name field
  3. Click Search
  4. Verify only orders with customer name containing "john" (case-insensitive) appear
- **Expected Result:** Results filtered by customer name

### Test 7.2: Phone Number Search
- **Steps:**
  1. Clear previous filters
  2. Enter "9876" in Phone Number field
  3. Click Search
  4. Verify orders with phone number containing "9876" appear
- **Expected Result:** Partial phone number match works

### Test 7.3: Date Range Filter
- **Steps:**
  1. Set Start Date: 10 days ago
  2. Set End Date: today
  3. Click Search
  4. Verify only orders within date range appear
- **Expected Result:** Orders filtered by date range

### Test 7.4: Combined Filters
- **Steps:**
  1. Enter Customer Name: "Alice"
  2. Enter Phone: "9876"
  3. Set Start Date
  4. Click Search
- **Expected Result:** All three filters applied together (OR for customer filters, AND with date)

### Test 7.5: Clear Filters
- **Steps:**
  1. Apply multiple filters
  2. Click "Clear" button
  3. Verify all filters reset and default time filter set to "today"
- **Expected Result:** All search fields cleared, new search loads default results

---

## 8. Compilation & Performance Tests

### Test 8.1: Build Without Errors
```bash
# Backend
npm run build

# Frontend  
cd client && npm run build
```
- **Expected Result:** Both build successfully without errors

### Test 8.2: No Console Errors
- **Steps:**
  1. Open browser DevTools Console
  2. Perform all operations in this test suite
  3. Monitor console for errors/warnings
- **Expected Result:** No red error messages; only normal logs

### Test 8.3: Performance - Page Load
- **Steps:**
  1. Open Orders page
  2. Check Network tab
  3. Verify page loads in < 2 seconds
  4. Monitor Memory usage (should be stable)
- **Expected Result:** Fast load times, no memory leaks

---

## 9. Accessibility & UX Tests

### Test 9.1: Modal Accessibility
- **Steps:**
  1. Open any confirmation modal
  2. Press Tab key - verify focus moves through buttons
  3. Press Escape key - verify modal closes
  4. Check aria-labels are present
- **Expected Result:** Modal is keyboard navigable and accessible

### Test 9.2: Mobile Responsive Design
- **Steps:**
  1. Open Orders on mobile (viewport < 768px)
  2. Verify search filters stack vertically
  3. Test on tablet (768px - 1024px)
  4. Verify layout adapts properly
- **Expected Result:** All layouts responsive and usable

### Test 9.3: Error Message Clarity
- **Steps:**
  1. Trigger various error conditions
  2. Verify error messages are clear and actionable
  3. Check error messages guide user on how to fix
- **Expected Result:** Users understand what went wrong and how to fix it

---

## 10. Integration Tests

### Test 10.1: Full Order Lifecycle
- **Steps:**
  1. Create order (custom + menu items)
  2. View in list and detail
  3. Modify items
  4. Add notes
  5. Print invoice
  6. Complete payment
  7. Verify table becomes available
  8. Check payment recorded in analytics
- **Expected Result:** Complete lifecycle works without errors

### Test 10.2: Payment Method Consistency
- **Steps:**
  1. Create order with Cash payment
  2. Create order with Card payment
  3. Create order with UPI payment
  4. Verify payment methods recorded correctly
  5. Check analytics shows breakdown by payment method
- **Expected Result:** All payment methods tracked accurately

### Test 10.3: Customer Loyalty Points
- **Steps:**
  1. Create order for customer with phone
  2. Complete payment
  3. Go to Customer Preferences
  4. Verify loyalty points updated (1 point per ₹100)
- **Expected Result:** Customer stats updated after payment

---

## Test Data Setup

### Create Test Branch
```
Name: Test Branch
Manager: Your Admin Account
Code: TB
Address: Test Location
```

### Create Test Tables
- Create tables 1-5 for testing

### Create Test Menu Items
- Create 5-10 items with different prices (₹50-₹500)

### Create Test Customers
- Manually add customer phone numbers for loyalty testing

---

## Reporting Issues

If you find any issues during testing:

1. **Document the issue:** Screenshot + steps to reproduce
2. **Check console:** Capture any console errors
3. **Backend logs:** Check server console for error details
4. **Database:** Verify data consistency in MongoDB

### Sample Issue Report
```
**Title:** Custom items show "Unknown Item" in list view
**Steps to Reproduce:**
1. Create order with custom item "Special Tea"
2. View in Orders list
**Expected:** Shows "Special Tea"
**Actual:** Shows "Unknown Item"
**Environment:** Chrome 120, Windows 11
**Console Error:** None
```

---

## Regression Testing Checklist

- [ ] Date handling (no invalid date errors)
- [ ] Custom items display correctly
- [ ] ConfirmationModal shows icons
- [ ] Alert icons display
- [ ] Payment validation works
- [ ] Table status updates on payment
- [ ] Coupon system functional
- [ ] Search/filter works
- [ ] No build errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All payment methods work
- [ ] Customer data updates
- [ ] Performance acceptable

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ No compilation warnings (except Tailwind CSS linting)
✅ All new features working as documented
✅ Existing features still work correctly
✅ Performance is acceptable
✅ Mobile responsive on all screen sizes

---

**Last Updated:** December 24, 2025  
**Test Coverage:** 90+ test scenarios  
**Estimated Time:** 2-3 hours for complete test suite
