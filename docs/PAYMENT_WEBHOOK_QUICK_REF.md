# Payment Webhook Quick Reference

## Webhook Endpoint

```
POST /api/payment/webhook
```

**Access:** Public (signature verified)

## Setup Checklist

- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to `.env`
- [ ] Configure webhook in Razorpay Dashboard
- [ ] Enable events: payment.captured, payment.failed, order.paid, refund.created
- [ ] Test webhook with Razorpay test mode
- [ ] Verify socket events emitted correctly

## Event Handlers

| Event | Action | Socket Event | Color Change |
|-------|--------|--------------|--------------|
| payment.captured | Mark paid, apply delta | payment_confirmation, order_paid | Red → Green |
| payment.failed | Log failure | payment_failed | Stay Red |
| payment.authorized | Set processing | payment_processing | Red → Yellow |
| order.paid | Backup paid handler | payment_confirmation | Red → Green |
| refund.created | Mark refunded, negative delta | order_refunded | Green → Gray |

## Socket Events

### payment_confirmation
```javascript
{
  orderId, orderNumber, amount, paymentMethod,
  paymentStatus: 'paid', razorpayPaymentId,
  tableId, tableNumber, timestamp,
  statusColor: 'green', previousColor: 'red'
}
```

### order_paid
```javascript
{
  orderId, orderNumber, table, 
  paymentMethod: 'online', amount, timestamp
}
```

### payment_failed
```javascript
{
  orderId, orderNumber, razorpayPaymentId,
  errorCode, errorDescription,
  tableId, tableNumber, timestamp
}
```

## Payment Status Flow

```
unpaid (red) → processing (yellow) → paid (green)
                    ↓
                 failed (red)
```

## Stats Delta Application

### Payment Captured
```javascript
await applyStatsDelta(branchId, {
  revenue: +order.total,
  orders: +1,
  items: +totalQuantity
});
```

### Refund Created
```javascript
await applyStatsDelta(branchId, {
  revenue: -refundAmount,
  orders: 0,
  items: -totalQuantity
});
```

## Client Integration

### Socket Listener
```javascript
socket.on('payment_confirmation', (data) => {
  // Update order UI: red → green
  setOrders(prev => prev.map(order => 
    order._id === data.orderId 
      ? { ...order, paymentStatus: 'paid' }
      : order
  ));
  
  // Show success toast
  toast.success(`Payment confirmed for ${data.orderNumber}`);
});
```

### Color Coding
```jsx
<div className={
  paymentStatus === 'paid' ? 'bg-green-50 border-green-500' :
  paymentStatus === 'unpaid' ? 'bg-red-50 border-red-500' :
  'bg-yellow-50 border-yellow-500'
}>
  {/* Order card */}
</div>
```

## Testing

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/payment/webhook \
  -H "x-razorpay-signature: <signature>" \
  -d @webhook-payload.json
```

### Test Payment Verification
```bash
curl -X POST http://localhost:5000/api/payment/verify \
  -H "Authorization: Bearer <token>" \
  -d '{
    "razorpay_order_id": "order_ABC",
    "razorpay_payment_id": "pay_XYZ",
    "razorpay_signature": "sig_hash",
    "orderId": "mongoId"
  }'
```

## Environment Variables

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=secret_xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
```

## Files Modified

1. ✅ `server/controllers/paymentController.js`
   - Added handleWebhook function
   - Added 5 event handlers
   - Enhanced verifyPayment function
   - Added socket event emissions
   - Added stats delta application

2. ✅ `server/routes/paymentRoutes.js`
   - Added POST /webhook route
   - Route placed before auth middleware

## Key Features

✅ Instant payment confirmation  
✅ Real-time UI updates (red→green)  
✅ Webhook signature verification  
✅ Payment status tracking  
✅ Incremental stats updates  
✅ Color-coded payment states  
✅ Comprehensive error handling  
✅ Idempotency checks  
✅ Socket event broadcasting  
✅ Payment record creation  

## Monitoring

Check logs for:
- `[Webhook] Received event: payment.captured`
- `[Webhook] Order ORD-123 marked as PAID`
- `[Payment] Order ORD-123 verified and marked as PAID`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Invalid signature | Check RAZORPAY_WEBHOOK_SECRET matches dashboard |
| Order not found | Verify razorpayOrderId stored correctly |
| Duplicate payments | Check idempotency logic (already paid check) |
| Socket not updating | Verify branch room joined correctly |
| Color not changing | Check socket listener and state update |

## Next Steps

- [ ] Test webhook in production
- [ ] Monitor payment success rate
- [ ] Set up alerts for failed payments
- [ ] Add retry mechanism for failed webhooks
- [ ] Implement payment analytics dashboard
