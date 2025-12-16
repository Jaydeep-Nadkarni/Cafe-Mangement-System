# API Documentation

## Authentication
- `POST /api/auth/register` - Register a new user (Admin only for creating managers)
- `POST /api/auth/login` - Login user

## Admin
- `GET /api/admin/analytics/global` - Get global analytics
- `GET /api/admin/analytics/branch/:branchId` - Get branch-specific analytics
- `POST /api/admin/branches` - Create a new branch
- `PUT /api/admin/branches/:id/status` - Update branch status

## Branch Management (Manager Only)
- `GET /api/branch/tables` - Get all tables for the manager's branch
- `GET /api/branch/menu` - Get menu items available for the branch
- `PUT /api/branch/menu/:id/availability` - Toggle item availability
- `POST /api/branch/tables/merge` - Merge two tables (move order)

## Order Management (Manager Only)
- `POST /api/orders` - Create a new order
  - Body: `{ tableId, items: [{ menuItemId, quantity, notes }], customerCount }`
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/items` - Add items to an existing order
  - Body: `{ items: [{ menuItemId, quantity, notes }] }`
- `PUT /api/orders/:id/coupon` - Apply a coupon code
  - Body: `{ code }`
- `POST /api/orders/:id/checkout` - Complete an order
  - Body: `{ paymentMethod, amountPaid }`
