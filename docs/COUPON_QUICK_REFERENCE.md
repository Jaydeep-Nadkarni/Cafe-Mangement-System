# Enhanced Coupon System - Quick Reference

## Coupon Types

### 1. Simple Discount ⭐
- **Use Case**: Basic percentage or fixed discount
- **Example**: 20% off any order
- **Validation**: Minimum bill amount only

### 2. Buy X Get Y 🎁
- **Use Case**: Purchase specific items to get free items
- **Example**: Buy 2 coffees, get 1 free
- **Validation**: Required item quantity check

### 3. Quantity-Based Flat ➕
- **Use Case**: Flat discount for minimum quantity
- **Example**: Buy 5+ items, get ₹100 off
- **Validation**: Total item count check

### 4. Category-Based 📂
- **Use Case**: Discount on specific product categories
- **Example**: 15% off on all beverages
- **Validation**: Category match check

---

## Usage Restrictions

| Restriction | Behavior | Example |
|-------------|----------|---------|
| **Total Usage Limit** | Max coupon uses overall | 1000 total uses |
| **Daily Usage Limit** | Max uses per calendar day | 50 per day |
| **Per-Table** | One use per table per day | Monday: 1 use per table |
| **Per-Order** | Apply only once per order | Can't stack same coupon |
| **Min Bill Amount** | Minimum order value | Requires ₹500 order |

---

## Validation Checklist

Before applying a coupon, backend validates:

- [ ] Code exists in database
- [ ] Coupon is active (not deactivated)
- [ ] Current date is within validity range
- [ ] Total usage hasn't exceeded limit
- [ ] Today's usage hasn't exceeded daily limit
- [ ] If per-table: table hasn't used today
- [ ] Order amount meets minimum requirement
- [ ] Required items/quantities present (if applicable)

---

## API Quick Calls

### Validate Coupon
```bash
curl -X POST /api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER20",
    "orderAmount": 1000,
    "items": [{
      "itemId": "123",
      "quantity": 2,
      "price": 500,
      "categoryId": "cat-1"
    }],
    "tableId": "table-5"
  }'
```

### Preview Discount
```bash
curl -X POST /api/coupons/preview \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER20",
    "sampleOrder": {
      "subtotal": 1000,
      "items": [...]
    }
  }'
```

### Create Coupon (Admin)
```bash
curl -X POST /api/admin/coupons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "code": "SUMMER20",
    "description": "20% off summer special",
    "couponType": "simple",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderAmount": 500,
    "maxDiscountAmount": 200,
    "usageLimit": 1000,
    "usagePerDay": 50,
    "validFrom": "2025-06-01",
    "validUntil": "2025-08-31"
  }'
```

---

## Discount Calculation Examples

### Simple Discount (20%)
```
Order: ₹1000
Discount: ₹1000 × 20% = ₹200
Max Cap: ₹150 (applied)
Final: ₹1000 - ₹150 = ₹850
```

### Quantity Flat Discount
```
Items: 6 units
Min Qty: 5
Flat Discount: ₹100
Final: Order Amount - ₹100
```

### Combined Discount (Hypothetical)
```
Base Discount: ₹100
Buy Get Discount: ₹200
Quantity Discount: ₹50
Total: ₹350 (before cap)
```

---

## Frontend Form Fields by Type

### Simple Discount
- Discount Type (percentage/fixed)
- Discount Value
- Max Discount Cap (if %)
- Min Order Amount

### Buy X Get Y
- Item to Buy (select)
- Buy Quantity
- Free Quantity
- Min Order Amount

### Quantity-Based
- Minimum Item Count
- Flat Discount Amount
- Min Order Amount

### Category-Based
- Select Categories
- Discount Percentage
- Min Order Amount

**All Types**: Usage Limit, Daily Limit, Per-Table Check, Validity Dates

---

## Usage Tracking

### Stored Metrics
```javascript
usageCount        // Total all-time uses
usageByDay        // Map<YYYY-MM-DD, count> - uses today
usageByTable      // Map<tableId, lastUsedDate> - for per-table check
```

### Example Flow
```
Day 1, Table 5:  usageByTable['table-5'] = Date('2025-12-21')
Day 1, Table 3:  usageByTable['table-3'] = Date('2025-12-21')
Day 2, Table 5:  Check: lastUsed < today → Allow
```

---

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid coupon code | Code doesn't exist | Check code spelling |
| Coupon is inactive | Admin disabled it | Wait for reactivation |
| Coupon is expired | Date range passed | Check validity dates |
| Daily limit reached | Max uses today exceeded | Try tomorrow |
| Per-table limit reached | Table already used today | Check table restriction |
| Minimum order amount | Order too small | Add more items |
| Item requirement not met | Missing required item | Add specified item |

---

## Best Practices

✅ **DO**
- Set clear validity dates
- Use daily limits for flash sales
- Require minimum orders to prevent abuse
- Set maximum discount caps for percentage discounts
- Include descriptive names for marketing

❌ **DON'T**
- Create unlimited usage coupons indefinitely
- Allow stacking multiple coupons on one order
- Set conflicting usage rules
- Forget to deactivate expired coupons
- Allow negative discounts

---

## Performance Tips

1. **Indexing**: Schema includes indexes for common queries
2. **Cleanup**: Daily usage data auto-deletes after 90 days
3. **Caching**: Cache active coupons in Redis (future enhancement)
4. **Batch Operations**: Use bulk create for seasonal campaigns

---

## Debugging

### Check Coupon Status
```javascript
db.coupons.findOne({ code: 'SUMMER20' })
// Look at: isActive, validFrom, validUntil, usageCount, usageLimit
```

### View Today's Usage
```javascript
const todayKey = new Date().toISOString().split('T')[0];
const usage = coupon.usageByDay.get(todayKey) || 0;
```

### Reset Coupon Usage (Admin Only)
```javascript
db.coupons.updateOne(
  { code: 'SUMMER20' },
  { $set: { usageCount: 0, usageByDay: new Map() } }
)
```

---

## Integration Checklist

- [ ] Coupon controller integrated with order routes
- [ ] Validation called before applying discount
- [ ] Discount passed to billing system
- [ ] UseCoupon called after successful payment
- [ ] Order includes appliedCoupon field
- [ ] Admin dashboard shows coupon statistics
- [ ] Email receipts show coupon discount applied
- [ ] User history shows used coupons

---

**Last Updated**: December 21, 2025  
**Status**: ✅ Ready for Production
