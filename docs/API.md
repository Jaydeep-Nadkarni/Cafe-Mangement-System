# API Documentation - Cafe Management System

REST API documentation for the Cafe Management System backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Endpoints

### Health Check

#### GET /health

Check server status.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-12-12T10:30:00.000Z"
}
```

---

### API Info

#### GET /api

Get API information and available endpoints.

**Request:**
```http
GET /api
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome to Cafe Management System API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "menu": "/api/menu",
    "orders": "/api/orders",
    "payments": "/api/payments",
    "ai": "/api/ai"
  }
}
```

---

## Menu Endpoints (Coming Soon)

### GET /api/menu
Get all menu items

### POST /api/menu
Create a new menu item (Admin only)

### PUT /api/menu/:id
Update menu item (Admin only)

### DELETE /api/menu/:id
Delete menu item (Admin only)

---

## Order Endpoints (Coming Soon)

### GET /api/orders
Get all orders (Admin) or user's orders

### POST /api/orders
Create a new order

### GET /api/orders/:id
Get order details

### PUT /api/orders/:id
Update order status (Admin only)

---

## Payment Endpoints (Coming Soon)

### POST /api/payments/create-order
Create Razorpay order

**Request Body:**
```json
{
  "amount": 100,
  "currency": "INR",
  "receipt": "receipt_order_123"
}
```

### POST /api/payments/verify
Verify payment signature

**Request Body:**
```json
{
  "orderId": "order_xxxxx",
  "paymentId": "pay_xxxxx",
  "signature": "signature_xxxxx"
}
```

---

## AI Endpoints (Coming Soon)

### POST /api/ai/recommendations
Get AI-powered menu recommendations

**Request Body:**
```json
{
  "preferences": {
    "dietary": "vegetarian",
    "cuisine": "italian",
    "budget": "medium"
  }
}
```

### POST /api/ai/chat
Chat with AI assistant

**Request Body:**
```json
{
  "message": "What are your best coffee options?"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- Rate limiting will be implemented in production
- Current limit: 100 requests per 15 minutes per IP

---

## Examples

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get API info
curl http://localhost:5000/api
```

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Get menu
const getMenu = async () => {
  try {
    const response = await api.get('/menu');
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Date fields accept ISO 8601 format
- Pagination will be added to list endpoints
- More endpoints will be documented as they are implemented

---

**For more information, see:**
- [Setup Guide](./SETUP.md)
- [Environment Variables](./ENVIRONMENT.md)
