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
 * Validate a coupon code
 * @param {string} code - Coupon code
 * @param {number} orderAmount - Total order amount (subtotal)
 * @returns {Object} - Validation result { isValid, coupon, error }
 */
const validateCoupon = async (code, orderAmount) => {
  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return { isValid: false, error: 'Invalid coupon code' };
  }

  if (!coupon.isActive) {
    return { isValid: false, error: 'Coupon is inactive' };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { isValid: false, error: 'Coupon is expired' };
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, error: 'Coupon usage limit reached' };
  }

  if (orderAmount < coupon.minOrderAmount) {
    return { isValid: false, error: `Minimum order amount of $${coupon.minOrderAmount} required` };
  }

  return { isValid: true, coupon };
};

/**
 * Calculate discount amount
 * @param {Object} coupon - Coupon object
 * @param {number} orderAmount - Order subtotal
 * @returns {number} - Discount amount
 */
const calculateDiscount = (coupon, orderAmount) => {
  let discount = 0;
  
  if (coupon.discountType === 'percentage') {
    discount = orderAmount * (coupon.discountValue / 100);
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed order amount
  return Math.min(discount, orderAmount);
};

/**
 * Mark coupon as used
 * @param {string} code - Coupon code
 */
const useCoupon = async (code) => {
  const coupon = await Coupon.findOne({ code });
  if (coupon) {
    coupon.usageCount += 1;
    await coupon.save();
  }
};

module.exports = {
  generateUniqueCode,
  createGameReward,
  validateCoupon,
  calculateDiscount,
  useCoupon
};
