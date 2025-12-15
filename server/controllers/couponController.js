const couponService = require('../services/couponService');

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Public (or Protected depending on requirements)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const result = await couponService.validateCoupon(code, orderAmount || 0);

    if (!result.isValid) {
      return res.status(400).json({ message: result.error });
    }

    // Return safe coupon details (hide internal fields)
    const safeCoupon = {
      code: result.coupon.code,
      description: result.coupon.description,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      minOrderAmount: result.coupon.minOrderAmount
    };

    res.json({ valid: true, coupon: safeCoupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validateCoupon
};
