# Cafe Management System - Backend API

Express.js REST API server for the Cafe Management System with Razorpay payment integration.

## Quick Start

### Prerequisites
- Node.js 14+ 
- npm 6+

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Razorpay credentials
nano .env
```

3. **Start the server**:

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Menu
- **GET** `/api/menu` - Get all menu items
- **GET** `/api/menu/:id` - Get single menu item

### Orders
- **POST** `/api/orders` - Create new order
  - Body: `{ items: [{itemId, quantity}], mobileNumber, customerName }`
- **GET** `/api/orders/:orderId` - Get order details

### Razorpay
- **POST** `/api/razorpay/create-order` - Create Razorpay order
  - Body: `{ amount, orderId, customerName, customerEmail, customerPhone }`
- **POST** `/api/razorpay/verify-payment` - Verify payment signature
  - Body: `{ razorpayPaymentId, razorpayOrderId, razorpaySignature }`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Client origin for CORS | `http://localhost:3000` |
| `RAZORPAY_KEY_ID` | Razorpay public key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | `secret_...` |

## Project Structure

```
server/
├── index.js              # Main server file with all routes
├── package.json          # Dependencies
├── .env                  # Environment variables (local)
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Development

### Available Scripts
- `npm start` - Start server in production mode
- `npm run dev` - Start server with nodemon (auto-reload on changes)

### Testing Endpoints

Use curl or Postman to test endpoints:

```bash
# Get all menu items
curl http://localhost:5000/api/menu

# Create an order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"itemId": 1, "quantity": 2}],
    "mobileNumber": "9876543210",
    "customerName": "John Doe"
  }'
```

## Razorpay Integration

### Setup
1. Create Razorpay account: https://razorpay.com
2. Get API keys from dashboard: https://dashboard.razorpay.com/app/keys
3. Add keys to `.env` file

### Test Mode
Use Razorpay test keys for development. See `.env.example` for format.

## CORS Configuration

CORS is configured to accept requests from `CLIENT_URL` (default: `http://localhost:3000`)

To allow additional origins, update the CORS configuration in `index.js`.

## Error Handling

All endpoints return JSON responses with the following structure:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Notes

- Always keep `.env` file private (never commit to git)
- Use environment variables for sensitive data
- Validate and sanitize all inputs (implement in production)
- Enable HTTPS in production
- Use actual Razorpay SDK for payment verification

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication & authorization
- [ ] Rate limiting
- [ ] Request logging
- [ ] Unit tests
- [ ] API documentation (Swagger)
- [ ] WebSocket for real-time updates

## License

Proprietary - Cafe Management System
