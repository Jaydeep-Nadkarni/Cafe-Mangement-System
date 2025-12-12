# API Testing Guide

Quick reference for testing the Cafe Management API endpoints.

## Base URL
```
http://localhost:5000
```

## Endpoints

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-12-12T10:30:00.000Z"
}
```

---

### 2. Get All Menu Items
```bash
curl http://localhost:5000/api/menu
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Espresso",
      "description": "Strong and bold",
      "price": 3.99,
      "category": "coffee",
      "image": "https://..."
    },
    ...
  ],
  "count": 8
}
```

---

### 3. Get Single Menu Item
```bash
curl http://localhost:5000/api/menu/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Espresso",
    "description": "Strong and bold",
    "price": 3.99,
    "category": "coffee",
    "image": "https://..."
  }
}
```

---

### 4. Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"itemId": 1, "quantity": 2},
      {"itemId": 3, "quantity": 1}
    ],
    "mobileNumber": "9876543210",
    "customerName": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD_1702389000000",
    "items": [
      {
        "id": 1,
        "name": "Espresso",
        "quantity": 2,
        "itemTotal": 7.98,
        ...
      }
    ],
    "subtotal": 11.48,
    "tax": 0.92,
    "total": 12.40,
    "mobileNumber": "9876543210",
    "customerName": "John Doe",
    "status": "pending",
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

---

### 5. Get Order Details
```bash
curl http://localhost:5000/api/orders/ORD_1702389000000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_1702389000000",
    "items": [...],
    "subtotal": 11.48,
    "tax": 0.92,
    "total": 12.40,
    "status": "pending",
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

---

### 6. Create Razorpay Order
```bash
curl -X POST http://localhost:5000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 12.40,
    "orderId": "ORD_1702389000000",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "9876543210"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_1702389000123",
    "entity": "order",
    "amount": 1240,
    "currency": "INR",
    "receipt": "ORD_1702389000000",
    "status": "created",
    "created_at": 1702389000
  }
}
```

---

### 7. Verify Payment
```bash
curl -X POST http://localhost:5000/api/razorpay/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayPaymentId": "pay_29QQoUBi66xm2f",
    "razorpayOrderId": "order_1702389000123",
    "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
  }'
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully",
  "data": {
    "razorpayPaymentId": "pay_29QQoUBi66xm2f",
    "razorpayOrderId": "order_1702389000123",
    "verified": true,
    "timestamp": "2025-12-12T10:30:00.000Z"
  }
}
```

---

## Using with Postman

1. Import the base URL: `http://localhost:5000`
2. Create requests for each endpoint
3. Use the JSON bodies provided above
4. Test in development mode

## Testing Workflow

1. **Get Menu** → View available items
2. **Create Order** → Place an order with items
3. **Create Razorpay Order** → Generate payment intent
4. **Verify Payment** → Confirm payment completion

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Valid amount is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Menu item not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Integration with Frontend

The frontend (`http://localhost:3000`) automatically calls these endpoints:

- Fetches menu from `/api/menu` on MenuPage load
- Creates order via `/api/orders` on checkout
- Generates Razorpay order via `/api/razorpay/create-order` before payment
- Verifies payment via `/api/razorpay/verify-payment` after successful payment

CORS is enabled to allow these cross-origin requests.
