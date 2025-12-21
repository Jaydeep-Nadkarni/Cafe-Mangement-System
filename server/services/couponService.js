const Coupon = require('../models/Coupon');
const crypto = require('crypto');

/**
 * Generate a unique coupon code
 * @param {string} prefix - Prefix for the code (e.g., 'WIN', 'GAME')
 * @returns {string} - Unique coupon code
 */
const generateUniqueCode = async (prefix = 'C') => {
  let code;
  let exists = true;
  
  while (exists) {
    const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `${prefix}-${randomString}`;
    const existing = await Coupon.findOne({ code });
    if (!existing) exists = false;
  }
  
  return code;
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} - Date string
 */
const getTodayKey = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Create a reward coupon for a game winner
 * @param {string} gameType - Type of game played
 * @param {number} score - Score achieved
 * @returns {Object} - Created coupon
 */
const createGameReward = async (gameType, score) => {
  // Determine reward based on game and score
  // This logic could be more complex or configuration-based
  let discountValue = 0;
  let discountType = 'percentage';
  
  if (score >= 80) {
    discountValue = 20; // 20% off for high score
  } else if (score >= 50) {
    discountValue = 10; // 10% off for medium score
  } else {
    return null; // No reward for low score
  }

  const code = await generateUniqueCode('GAME');
  
  // Set expiry to end of day
  const validUntil = new Date();
  validUntil.setHours(23, 59, 59, 999);

  const coupon = await Coupon.create({
    code,
    description: `Reward for ${gameType} (Score: ${score})`,
    discountType,
    discountValue,
    minOrderAmount: 10, // Minimum order $10
    usageLimit: 1, // Single use
    validFrom: new Date(),
    validUntil,
    isActive: true
  });

  return coupon;
};

/**
 * Validate a coupon code with comprehensive rules
 * @param {string} code - Coupon code
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result { isValid, coupon, error, discount }
 */
const validateCoupon = async (code, options = {}) => {
  const {
    orderAmount = 0,
    items = [],
    tableId = null,
    branchId = null
  } = options;

  try {
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return { isValid: false, error: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { isValid: false, error: 'Coupon is inactive' };
    }

    // Date validation
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { isValid: false, error: 'Coupon is expired or not yet valid' };
    }

    // Minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return { 
        isValid: false, 
        error: `Minimum order amount of ₹${coupon.minOrderAmount} required. Current: ₹${orderAmount}` 
      };
    }

    // Total usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, error: 'Coupon usage limit reached' };
    }

    // Daily usage limit
    if (coupon.usagePerDay !== null) {
      const todayKey = getTodayKey();
      const todayUsage = coupon.usageByDay.get(todayKey) || 0;
      if (todayUsage >= coupon.usagePerDay) {
        return { 
          isValid: false, 
          error: `Coupon daily limit reached (${coupon.usagePerDay} per day)` 
        };
      }
    }

    // Per-table restriction
    if (coupon.usagePerTable && tableId) {
      const lastUsed = coupon.usageByTable.get(tableId);
      if (lastUsed) {
        const lastUsedDate = new Date(lastUsed).toISOString().split('T')[0];
        const todayKey = getTodayKey();
        if (lastUsedDate === todayKey) {
          return { 
            isValid: false, 
            error: 'This coupon has already been used at this table today' 
          };
        }
      }
    }

    // Validate Buy X Get Y rules
    if (coupon.buyXGetYRules?.enabled) {
      const itemInOrder = items.find(item => item.itemId === coupon.buyXGetYRules.itemId);
      if (!itemInOrder || itemInOrder.quantity < coupon.buyXGetYRules.quantity) {
        return { 
          isValid: false, 
          error: `Requires at least ${coupon.buyXGetYRules.quantity} of ${coupon.buyXGetYRules.itemName}` 
        };
      }
    }

    // Validate quantity rules
    if (coupon.quantityRules?.enabled) {
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      if (totalQuantity < coupon.quantityRules.minQuantity) {
        return { 
          isValid: false, 
          error: `Minimum ${coupon.quantityRules.minQuantity} items required` 
        };
      }
    }

    return { isValid: true, coupon };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return { isValid: false, error: 'Validation error occurred' };
  }
};

/**
 * Calculate discount amount with advanced rules
 * @param {Object} coupon - Coupon object
 * @param {Object} options - Calculation options
 * @returns {Object} - { discount, breakdown }
 */
const calculateDiscount = (coupon, options = {}) => {
  const {
    orderAmount = 0,
    items = [],
    applicableAmount = null
  } = options;

  let discount = 0;
  const breakdown = {
    baseDiscount: 0,
    buyGetDiscount: 0,
    quantityDiscount: 0,
    categoryDiscount: 0,
    totalDiscount: 0
  };

  try {
    // Calculate base discount (percentage or fixed)
    let baseAmount = applicableAmount !== null ? applicableAmount : orderAmount;
    
    if (coupon.discountType === 'percentage') {
      discount = baseAmount * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }
    breakdown.baseDiscount = discount;

    // Buy X Get Y discount
    if (coupon.buyXGetYRules?.enabled) {
      const targetItem = items.find(item => item.itemId === coupon.buyXGetYRules.itemId);
      if (targetItem) {
        const freeItems = Math.floor(targetItem.quantity / coupon.buyXGetYRules.quantity) * coupon.buyXGetYRules.freeQuantity;
        breakdown.buyGetDiscount = freeItems * (targetItem.price || 0);
        discount += breakdown.buyGetDiscount;
      }
    }

    // Quantity-based flat discount
    if (coupon.quantityRules?.enabled) {
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      if (totalQuantity >= coupon.quantityRules.minQuantity) {
        breakdown.quantityDiscount = coupon.quantityRules.flatDiscount;
        discount += breakdown.quantityDiscount;
      }
    }

    // Category-based discount
    if (coupon.categoryRules?.enabled && coupon.categoryRules.categoryIds.length > 0) {
      const categoryAmount = items
        .filter(item => coupon.categoryRules.categoryIds.includes(item.categoryId))
        .reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
      
      if (categoryAmount > 0) {
        const categoryDiscount = categoryAmount * (coupon.categoryRules.discountPercent / 100);
        breakdown.categoryDiscount = categoryDiscount;
        discount += categoryDiscount;
      }
    }

    breakdown.totalDiscount = discount;

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount);

    return {
      discount: Math.round(discount * 100) / 100, // Round to 2 decimals
      breakdown,
      isApplicable: discount > 0
    };
  } catch (error) {
    console.error('Discount calculation error:', error);
    return {
      discount: 0,
      breakdown,
      error: 'Error calculating discount',
      isApplicable: false
    };
  }
};

/**
 * Mark coupon as used with tracking
 * @param {string} code - Coupon code
 * @param {Object} options - Usage options
 * @returns {Object} - Updated coupon
 */
const useCoupon = async (code, options = {}) => {
  const { tableId = null } = options;
  
  try {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Increment total usage
    coupon.usageCount += 1;

    // Track daily usage
    const todayKey = getTodayKey();
    const currentDayUsage = coupon.usageByDay.get(todayKey) || 0;
    coupon.usageByDay.set(todayKey, currentDayUsage + 1);

    // Track per-table usage
    if (tableId && coupon.usagePerTable) {
      coupon.usageByTable.set(tableId.toString(), new Date());
    }

    // Clean up old daily usage data (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
    
    for (const [dateKey] of coupon.usageByDay) {
      if (dateKey < cutoffDate) {
        coupon.usageByDay.delete(dateKey);
      }
    }

    await coupon.save();
    return coupon;
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    throw error;
  }
};

/**
 * Generate coupon preview with sample order
 * @param {Object} coupon - Coupon object
 * @param {Object} sampleOrder - Sample order data
 * @returns {Object} - Preview data
 */
const generateCouponPreview = (coupon, sampleOrder = {}) => {
  const {
    subtotal = 500,
    items = [],
    minBillAmount = coupon.minOrderAmount || 0
  } = sampleOrder;

  // Check if order meets minimum requirement
  if (subtotal < minBillAmount) {
    return {
      valid: false,
      message: `Order must be at least ₹${minBillAmount}. Current: ₹${subtotal}`,
      preview: null
    };
  }

  const discountResult = calculateDiscount(coupon, { 
    orderAmount: subtotal, 
    items 
  });

  return {
    valid: true,
    message: `You save ₹${discountResult.discount} on this order`,
    preview: {
      subtotal,
      discount: discountResult.discount,
      breakdown: discountResult.breakdown,
      final: subtotal - discountResult.discount
    }
  };
};

/**
 * Get coupon details with preview
 * @param {string} code - Coupon code
 * @param {Object} sampleOrder - Optional sample order for preview
 * @returns {Object} - Coupon details with preview
 */
const getCouponDetails = async (code, sampleOrder = {}) => {
  try {
    const coupon = await Coupon.findOne({ code });
    
    if (!coupon) {
      return { found: false, error: 'Coupon not found' };
    }

    const preview = generateCouponPreview(coupon, sampleOrder);

    return {
      found: true,
      code: coupon.code,
      description: coupon.description,
      couponType: coupon.couponType,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      preview
    };
  } catch (error) {
    console.error('Error getting coupon details:', error);
    return { found: false, error: 'Error retrieving coupon' };
  }
};

module.exports = {
  generateUniqueCode,
  createGameReward,
  validateCoupon,
  calculateDiscount,
  useCoupon,
  generateCouponPreview,
  getCouponDetails,
  getTodayKey
};
