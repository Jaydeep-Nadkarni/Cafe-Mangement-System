# Order Merge Feature Documentation

## Overview
Comprehensive order merge system allowing branch managers to combine multiple unpaid orders from the same table into a single order with full validation, preview, and audit trail.

## Backend Implementation

### Database Schema Changes

#### Order Model (`server/models/Order.js`)
Added merge metadata fields:
```javascript
{
  isMerged: { type: Boolean, default: false },
  mergedAt: Date,
  originalOrderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  mergeNote: String
}
```

### API Endpoints

#### 1. Get Merge Preview
**Endpoint:** `POST /api/orders/merge/preview`  
**Auth:** Required (Manager)  
**Purpose:** Validate and preview merge without executing

**Request:**
```json
{
  "orderIds": ["order1", "order2", "order3"]
}
```

**Response:**
```json
{
  "valid": true,
  "orders": [
    {
      "_id": "order1",
      "orderNumber": "ORD-2024-001",
      "total": 150,
      "itemCount": 3
    }
  ],
  "combined": {
    "items": [
      {
        "menuItem": { "name": "Coffee", "_id": "..." },
        "quantity": 4,
        "price": 50
      }
    ],
    "subtotal": 400,
    "tax": 40,
    "total": 440,
    "totalQuantity": 8
  },
  "orderCount": 3
}
```

**Validation Rules:**
- Minimum 2 orders required
- All orders must exist
- All orders must be from the same table
- All orders must be unpaid (paymentStatus === 'unpaid')
- All orders must have active/pending status
- No merged orders allowed

#### 2. Execute Merge
**Endpoint:** `POST /api/orders/merge`  
**Auth:** Required (Manager)  
**Purpose:** Atomically merge orders using MongoDB transaction

**Request:**
```json
{
  "orderIds": ["order1", "order2", "order3"]
}
```

**Response:**
```json
{
  "success": true,
  "mergedOrder": {
    "_id": "newOrderId",
    "orderNumber": "ORD-2024-NEW",
    "items": [...],
    "total": 440,
    "isMerged": true,
    "originalOrderIds": ["order1", "order2", "order3"]
  }
}
```

**Transaction Steps:**
1. Start MongoDB session
2. Validate all orders (same as preview)
3. Aggregate items with quantity consolidation
4. Create new merged order with audit fields
5. Mark original orders as cancelled
6. Remove original orders from table.currentOrders
7. Add merged order to table.currentOrders
8. Commit transaction or abort on error

### Controller Logic (`server/controllers/orderController.js`)

```javascript
// Merge Preview (validation only)
exports.getMergePreview = async (req, res) => {
  // 1. Validate order IDs format
  // 2. Fetch orders with table population
  // 3. Check minimum count (2+)
  // 4. Validate same table
  // 5. Check all unpaid
  // 6. Verify no merged orders
  // 7. Aggregate items
  // 8. Calculate totals
  // 9. Return preview object
};

// Merge Execution (with transaction)
exports.mergeOrders = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Same validation as preview
    // 2. Aggregate items with quantities
    // 3. Create merged order with audit trail
    // 4. Cancel original orders
    // 5. Update table.currentOrders array
    // 6. Commit transaction
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    // Return error
  } finally {
    session.endSession();
  }
};
```

## Frontend Implementation

### UI Components (`client/src/admins/components/branch/Orders.jsx`)

#### State Management
```javascript
const [showMergeModal, setShowMergeModal] = useState(false);
const [selectedOrdersForMerge, setSelectedOrdersForMerge] = useState([]);
const [mergePreview, setMergePreview] = useState(null);
const [showMergePreview, setShowMergePreview] = useState(false);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);
```

#### Merge Flow

1. **Start Merge**
   - Click "Merge Orders" button in header
   - Opens MergeSelectionModal
   - Shows only unpaid, non-merged orders

2. **Select Orders**
   - Checkbox selection interface
   - Visual feedback (purple border for selected)
   - Shows order details: table, items preview, total
   - Enable "Preview Merge" when 2+ selected

3. **Preview Merge**
   - Calls `POST /api/orders/merge/preview`
   - Validates: same table, all unpaid
   - Shows MergePreviewModal with:
     - Source orders summary
     - Combined items list
     - Totals (subtotal + tax)
     - Item count and order count

4. **Confirm Merge**
   - Click "Confirm Merge" in preview
   - Calls `POST /api/orders/merge`
   - MongoDB transaction ensures atomicity
   - Success: refreshes orders, shows success message
   - Error: shows error message with reason

#### Modal Components

**1. MergeSelectionModal**
- Grid layout of selectable orders
- Checkbox + click-to-select
- Shows table number, order number, items preview, total
- Footer: selection count + action buttons

**2. MergePreviewModal**
- Source orders section (compact cards)
- Arrow indicator (merge direction)
- Combined order preview (purple themed)
- Detailed breakdown: items, subtotal, tax, total
- Confirmation buttons

**3. ConfirmationModal**
- Reusable for errors/success/confirmations
- Icon-based visual feedback (error/success/info)
- Title + message
- Action buttons (dynamic based on type)

### Visual Indicators

#### Merged Badge
- Purple badge with ShieldCheck icon
- Shows "MERGED" label
- Displayed on merged orders
- Indicates audit trail exists

#### Selection State
- Purple border for selected orders
- Purple background tint
- Checkbox checked state
- Hover effects

#### Color Coding
- Red border: Unpaid orders
- Green border: Paid orders
- Purple theme: Merge-related UI
- Gray: Cancelled/merged orders (lighter)

## Data Flow

```
User Action → Frontend Validation → API Call → Backend Validation
    ↓                                              ↓
Preview Modal ← Response            MongoDB Transaction
    ↓                                              ↓
User Confirms                        Aggregate Items
    ↓                                              ↓
API Call → Backend Execution         Create Merged Order
    ↓                                              ↓
Success Message ← Response           Update Database
    ↓
Refresh Orders List
```

## Audit Trail

Each merged order contains:
- `isMerged`: true flag
- `originalOrderIds`: Array of source order IDs
- `mergedAt`: ISO timestamp
- `mergeNote`: Optional note (future feature)

Original orders remain in database with:
- `status`: 'cancelled'
- Can be queried for historical reporting
- Not displayed in active orders view

## Error Handling

### Validation Errors
- "Minimum 2 orders required"
- "All orders must be from the same table"
- "All orders must be unpaid"
- "Cannot merge already merged orders"

### Transaction Errors
- Automatic rollback on any failure
- No partial state changes
- User-friendly error messages
- Logs for debugging

## Security

- Manager role required
- Branch-specific access control
- MongoDB transactions ensure data integrity
- Audit trail for compliance

## Future Enhancements

1. **Merge Notes**: Add optional note when merging
2. **Unmerge**: Split merged order back to originals (complex)
3. **Merge History**: View merge history for reporting
4. **Partial Merge**: Merge subset of items from orders
5. **Cross-Table Merge**: Merge from different tables (with warnings)
6. **Merge Templates**: Save common merge patterns

## Testing Checklist

- [ ] Select 2+ unpaid orders from same table
- [ ] Verify preview shows combined items correctly
- [ ] Confirm quantities aggregate (2x Coffee + 1x Coffee = 3x Coffee)
- [ ] Verify totals calculate correctly (subtotal + tax)
- [ ] Test merge execution creates merged order
- [ ] Verify original orders marked cancelled
- [ ] Check table.currentOrders updated correctly
- [ ] Test validation: different tables (should fail)
- [ ] Test validation: paid order selected (should fail)
- [ ] Test validation: merged order selected (should fail)
- [ ] Verify merged badge displays on merged orders
- [ ] Test transaction rollback on error
- [ ] Verify audit trail fields populated correctly

## Migration Notes

### Existing Data
No migration required for existing orders. New fields:
- `isMerged`: defaults to false
- `originalOrderIds`: defaults to empty array
- `mergedAt`: undefined for non-merged orders

### Table Schema
Tables already updated to use `currentOrders` array in previous implementation.

## Performance Considerations

- Uses MongoDB aggregation for item consolidation
- Transactions add overhead but ensure consistency
- Indexes on table, paymentStatus for fast filtering
- Preview endpoint caches validation results
- Real-time updates via Socket.io (if implemented)
