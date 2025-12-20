# Payment Webhook System Documentation

## Overview
Comprehensive payment webhook handler for instant payment confirmation with real-time UI updates, color coding, and proper payment verification.

## Architecture

### Event Flow
```
Payment Gateway (Razorpay)
    ↓ webhook
Server Webhook Handler
    ↓ verify signature
Update Order & Payment Records
    ↓ apply stats delta
Emit Socket Events
    ↓ instant
Client UI Updates (red→green)
```

## Webhook Endpoint

### POST /api/payment/webhook
**Access:** Public (verified by signature)

Handles incoming webhooks from Razorpay payment gateway.

#### Security
- Verifies `x-razorpay-signature` header
- Compares with HMAC SHA256 signature
- Rejects unauthorized requests

#### Supported Events

1. **payment.captured** - Payment successfully captured
2. **payment.failed** - Payment attempt failed
3. **payment.authorized** - Payment authorized (for later capture)
4. **order.paid** - Razorpay order fully paid
5. **refund.created** - Refund issued

## Payment Verification Flow

### Client-Side Verification
```
POST /api/payment/verify
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_XYZ789",
  "razorpay_signature": "signature_hash",
  "orderId": "mongoId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "orderId": "mongoId",
  "orderNumber": "ORD-123",
  "paymentId": "paymentMongoId"
}
```

### Verification Steps
1. Verify HMAC SHA256 signature
2. Check order exists and not already paid
3. Update order paymentStatus: `unpaid` → `paid`
4. Update order status: `ready` → `paid` (if applicable)
5. Create/update Payment record
6. Apply stats delta: `{ revenue: +amount, orders: +1, items: +qty }`
7. Emit socket events: `payment_confirmation`, `order_paid`
8. Trigger stats update

## Payment Status Updates

### Order Model Fields Updated
```javascript
{
  paymentStatus: 'paid',           // unpaid → paid
  paymentMethod: 'online',         // null → online
  razorpayPaymentId: 'pay_XYZ',    // Store payment ID
  razorpayOrderId: 'order_ABC',    // Store order ID
  razorpaySignature: 'sig_hash',   // Store signature
  paidAt: new Date(),              // Timestamp
  status: 'paid'                   // If currently 'ready'
}
```

### Payment Model Record
```javascript
{
  order: ObjectId,
  branch: ObjectId,
  amount: 450.00,
  paymentMethod: 'online',
  paymentGateway: 'razorpay',
  status: 'completed',
  paymentReference: {
    razorpayPaymentId: 'pay_XYZ',
    razorpayOrderId: 'order_ABC',
    razorpaySignature: 'sig_hash'
  },
  completedAt: new Date(),
  metadata: {
    webhookEvent: 'payment.captured',
    capturedAt: new Date(),
    method: 'card',
    email: 'user@example.com',
    contact: '+919876543210'
  }
}
```

## Real-Time Socket Events

### 1. payment_confirmation
**Emitted:** When payment is verified/captured

**Payload:**
```javascript
{
  orderId: "mongoId",
  orderNumber: "ORD-123",
  amount: 450.00,
  paymentMethod: "online",
  paymentStatus: "paid",
  razorpayPaymentId: "pay_XYZ",
  tableId: "tableMongoId",
  tableNumber: 5,
  timestamp: "2024-12-20T10:30:00Z",
  // Color coding for UI
  statusColor: "green",
  previousColor: "red"
}
```

**UI Actions:**
- Update order card background: red → green
- Show success badge/notification
- Update payment status indicator
- Animate transition with 300ms fade

### 2. order_paid
**Emitted:** For stats aggregation

**Payload:**
```javascript
{
  orderId: "mongoId",
  orderNumber: "ORD-123",
  table: "tableMongoId",
  paymentMethod: "online",
  amount: 450.00,
  timestamp: "2024-12-20T10:30:00Z"
}
```

**Stats Updates:**
- Increment: `totalRevenue` + amount
- Increment: Payment breakdown by method
- Decrement: `activeOrders` - 1

### 3. payment_failed
**Emitted:** When payment attempt fails

**Payload:**
```javascript
{
  orderId: "mongoId",
  orderNumber: "ORD-123",
  razorpayPaymentId: "pay_XYZ",
  errorCode: "BAD_REQUEST_ERROR",
  errorDescription: "Payment failed",
  tableId: "tableMongoId",
  tableNumber: 5,
  timestamp: "2024-12-20T10:30:00Z"
}
```

**UI Actions:**
- Show error notification
- Display retry option
- Keep order card red
- Log failure reason

### 4. payment_processing
**Emitted:** When payment is authorized but not captured

**Payload:**
```javascript
{
  orderId: "mongoId",
  orderNumber: "ORD-123",
  razorpayPaymentId: "pay_XYZ",
  tableId: "tableMongoId",
  tableNumber: 5,
  timestamp: "2024-12-20T10:30:00Z"
}
```

**UI Actions:**
- Show "Processing..." status
- Display spinner/loader
- Keep order card yellow/orange

## Color Coding System

### Payment Status Colors

| Payment Status | Color | Hex Code | CSS Class |
|---------------|-------|----------|-----------|
| Unpaid | Red | #ef4444 | bg-red-500 |
| Processing | Yellow | #f59e0b | bg-yellow-500 |
| Paid | Green | #10b981 | bg-green-500 |
| Failed | Dark Red | #dc2626 | bg-red-600 |
| Refunded | Gray | #6b7280 | bg-gray-500 |

### Order Status Colors

| Order Status | Color | Hex Code | CSS Class |
|-------------|-------|----------|-----------|
| Created | Blue | #3b82f6 | bg-blue-500 |
| Confirmed | Indigo | #6366f1 | bg-indigo-500 |
| Preparing | Purple | #8b5cf6 | bg-purple-500 |
| Ready | Orange | #f97316 | bg-orange-500 |
| Paid | Green | #10b981 | bg-green-500 |
| Closed | Gray | #6b7280 | bg-gray-500 |
| Cancelled | Red | #ef4444 | bg-red-500 |

### UI Implementation

#### Order Card Color Transition
```jsx
<div 
  className={`
    transition-colors duration-300 ease-in-out
    ${order.paymentStatus === 'paid' ? 'bg-green-50 border-green-500' : 
      order.paymentStatus === 'unpaid' ? 'bg-red-50 border-red-500' :
      'bg-yellow-50 border-yellow-500'}
  `}
>
  {/* Order content */}
</div>
```

#### Payment Status Badge
```jsx
<span 
  className={`
    px-3 py-1 rounded-full text-xs font-semibold
    ${paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
      paymentStatus === 'unpaid' ? 'bg-red-100 text-red-800' :
      paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
      'bg-gray-100 text-gray-800'}
  `}
>
  {paymentStatus.toUpperCase()}
</span>
```

#### Socket Listener for Color Updates
```javascript
socket.on('payment_confirmation', (data) => {
  setOrders(prev => prev.map(order => 
    order._id === data.orderId 
      ? { 
          ...order, 
          paymentStatus: 'paid',
          statusColor: 'green',
          animateTransition: true 
        }
      : order
  ));
  
  // Show success notification
  toast.success(`Payment confirmed for ${data.orderNumber}`);
});
```

## Webhook Event Handlers

### handlePaymentCaptured(paymentEntity)
**Triggered:** When payment is successfully captured

**Actions:**
1. Find order by `razorpayOrderId`
2. Verify not already paid
3. Update order: `paymentStatus = 'paid'`, `status = 'paid'`
4. Create/update Payment record
5. Apply stats delta: `{ revenue: +amount, orders: +1, items: +qty }`
6. Emit: `payment_confirmation`, `order_paid`
7. Trigger stats update

### handlePaymentFailed(paymentEntity)
**Triggered:** When payment attempt fails

**Actions:**
1. Find order by `razorpayOrderId`
2. Create Payment record with `status: 'failed'`
3. Store failure reason: `errorCode` + `errorDescription`
4. Emit: `payment_failed`
5. Log failure for debugging

### handlePaymentAuthorized(paymentEntity)
**Triggered:** When payment is authorized (not captured yet)

**Actions:**
1. Find order by `razorpayOrderId`
2. Create Payment record with `status: 'processing'`
3. Emit: `payment_processing`
4. Wait for capture event

### handleOrderPaid(orderEntity)
**Triggered:** When Razorpay order is fully paid

**Actions:**
1. Find order by `razorpayOrderId`
2. If not already paid, mark as paid
3. Apply stats delta
4. Emit: `payment_confirmation`
5. Trigger stats update

### handleRefundCreated(refundEntity)
**Triggered:** When refund is issued

**Actions:**
1. Find order by `razorpayPaymentId`
2. Update order: `paymentStatus = 'refunded'`
3. Update Payment record: `status = 'refunded'`
4. Apply negative stats delta: `{ revenue: -amount, orders: 0, items: -qty }`
5. Emit: `order_refunded`
6. Trigger stats update

## Incremental Stats Updates

### On Payment Confirmation
```javascript
await applyStatsDelta(branchId, {
  revenue: order.total,      // +450.00
  orders: 1,                  // +1 completed order
  items: totalQuantity        // +8 items sold
});
```

### On Refund
```javascript
await applyStatsDelta(branchId, {
  revenue: -refundAmount,     // -450.00
  orders: 0,                  // Don't change order count
  items: -totalQuantity       // -8 items (reverse sale)
});
```

## Environment Variables

Required in `.env`:
```bash
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=secret_xxxxx

# Webhook Secret (from Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
```

## Razorpay Dashboard Setup

### 1. Create Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click "Add New Webhook"
3. URL: `https://yourdomain.com/api/payment/webhook`
4. Active Events:
   - `payment.captured`
   - `payment.failed`
   - `payment.authorized`
   - `order.paid`
   - `refund.created`
5. Secret: Generate and copy to `.env`

### 2. Test Webhooks
1. Use Razorpay Test Mode
2. Create test payment
3. Verify webhook received in logs
4. Check signature verification passes
5. Confirm order status updates

## Testing

### Manual Webhook Testing
```bash
# Test webhook endpoint
curl -X POST http://localhost:5000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test456",
          "amount": 45000,
          "method": "card",
          "status": "captured"
        }
      }
    }
  }'
```

### Test Payment Flow
1. Create order: `POST /api/orders`
2. Create Razorpay order: `POST /api/payment/create-order`
3. Complete payment in frontend
4. Verify payment: `POST /api/payment/verify`
5. Check webhook received (if enabled)
6. Verify order status: `GET /api/orders/:id`
7. Check socket event emitted
8. Verify UI color change (red → green)

## Error Handling

### Webhook Signature Mismatch
```json
{
  "error": "Invalid signature"
}
```
**Status:** 400 Bad Request

### Order Not Found
- Log error to console
- Return 200 OK (to prevent retries)
- Alert admin via monitoring

### Payment Already Processed
- Log duplicate event
- Return 200 OK
- No database updates

### Database Errors
```json
{
  "error": "Webhook processing failed"
}
```
**Status:** 500 Internal Server Error
- Razorpay will retry webhook
- Check logs for details

## Monitoring & Logs

### Webhook Logs
```javascript
[Webhook] Received event: payment.captured
[Webhook] Payment captured: pay_XYZ for order: order_ABC
[Webhook] Order ORD-123 marked as PAID - Payment Status: paid
[Webhook] Payment confirmation events emitted for order ORD-123
```

### Payment Verification Logs
```javascript
[Payment] Order ORD-123 verified and marked as PAID
```

### Error Logs
```javascript
[Webhook] Invalid signature
[Webhook] Order not found for Razorpay Order ID: order_ABC
[Webhook] Error handling payment.captured: [error details]
```

## Best Practices

1. **Always Verify Signatures**
   - Never trust webhook payload without signature verification
   - Use constant-time comparison for signature

2. **Idempotency**
   - Check if payment already processed
   - Prevent duplicate charges/refunds
   - Use transaction IDs for deduplication

3. **Error Handling**
   - Return 200 OK even for known errors (prevent retries)
   - Log all errors with context
   - Alert on critical failures

4. **Security**
   - Use HTTPS in production
   - Keep webhook secret secure
   - Validate all input data
   - Rate limit webhook endpoint

5. **Real-Time Updates**
   - Emit socket events immediately after database updates
   - Include all necessary data for UI updates
   - Use color coding for visual feedback

6. **Testing**
   - Test all webhook events in test mode
   - Verify signature validation works
   - Test duplicate event handling
   - Check socket events emitted correctly

## Summary

✅ **Implemented:**
- Webhook handler for 5 payment events
- Signature verification for security
- Instant payment status updates
- Payment record creation/updates
- Incremental stats delta application
- Real-time socket events: `payment_confirmation`, `order_paid`, `payment_failed`, `payment_processing`
- Color coding system (red→green on payment)
- Enhanced payment verification endpoint
- Comprehensive error handling
- Idempotency checks

✅ **Payment Flow:**
1. Order created (status: unpaid, color: red)
2. Payment initiated via Razorpay
3. Payment captured (webhook received)
4. Signature verified
5. Order updated (status: paid, color: green)
6. Payment record created
7. Stats delta applied
8. Socket events emitted
9. UI updates instantly with color transition

✅ **Security:**
- HMAC SHA256 signature verification
- Webhook secret validation
- Protected endpoints with auth
- Input validation and sanitization
