const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');

/**
 * Calculate order totals including tax and discounts
 */
const calculateOrderTotals = async (items, couponCode = null) => {
  let subtotal = 0;
  const processedItems = [];

  // 1. Validate items and calculate subtotal
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItem}`);
    }
    
    if (!menuItem.isAvailable) {
      throw new Error(`Menu item is currently unavailable: ${menuItem.name}`);
    }

    const itemTotal = menuItem.price * item.quantity;
    subtotal += itemTotal;

    processedItems.push({
      menuItem: menuItem._id,
      quantity: item.quantity,
      price: menuItem.price,
      specialInstructions: item.specialInstructions,
      status: 'pending'
    });
  }

  // 2. Calculate Tax (e.g., 10%)
  const taxRate = 0.10;
  const tax = subtotal * taxRate;

  // 3. Calculate Discount
  let discount = 0;
  let couponId = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ 
      code: couponCode, 
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (coupon) {
      // Check minimum order amount
      if (subtotal >= coupon.minOrderAmount) {
        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          throw new Error('Coupon usage limit reached');
        }

        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
        } else {
          discount = coupon.discountValue;
        }
        couponId = coupon._id;
      }
    }
  }

  const total = subtotal + tax - discount;

  return {
    items: processedItems,
    subtotal,
    tax,
    discount,
    total,
    couponId
  };
};

module.exports = {
  calculateOrderTotals
};
