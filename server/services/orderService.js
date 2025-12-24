const MenuItem = require('../models/MenuItem');
const couponService = require('./couponService');

/**
 * Calculate order totals including tax and discounts
 */
const calculateOrderTotals = async (items, couponCode = null) => {
  let subtotal = 0;
  const processedItems = [];

  // 1. Validate items and calculate subtotal
  for (const item of items) {
    let price = 0;
    let name = '';
    let menuItemId = null;

    if (item.menuItem) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItem}`);
      }
      
      if (!menuItem.isAvailable) {
        throw new Error(`Menu item is currently unavailable: ${menuItem.name}`);
      }
      price = menuItem.price;
      name = menuItem.name;
      menuItemId = menuItem._id;
    } else {
      // Custom/Open item
      price = item.price || 0;
      name = item.name || 'Custom Item';
    }

    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    processedItems.push({
      menuItem: menuItemId,
      name: name,
      quantity: item.quantity,
      price: price,
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
    const validation = await couponService.validateCoupon(couponCode, subtotal);
    
    if (validation.isValid) {
      discount = couponService.calculateDiscount(validation.coupon, subtotal);
      couponId = validation.coupon._id;
    } else {
      // If coupon is invalid, we can either throw an error or just ignore it.
      // Throwing an error is better for feedback.
      throw new Error(validation.error);
    }
  }

  const total = subtotal + tax - discount;

  return {
    items: processedItems,
    subtotal,
    tax,
    discount,
    total,
    couponId,
    couponCode: couponId ? couponCode : null
  };
};

module.exports = {
  calculateOrderTotals
};
