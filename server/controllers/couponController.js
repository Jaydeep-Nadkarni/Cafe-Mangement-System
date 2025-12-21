const couponService = require('../services/couponService');
const Coupon = require('../models/Coupon');

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Public (or Protected depending on requirements)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, items, tableId, branchId } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const result = await couponService.validateCoupon(code, {
      orderAmount: orderAmount || 0,
      items: items || [],
      tableId,
      branchId
    });

    if (!result.isValid) {
      return res.status(400).json({ message: result.error });
    }

    // Calculate discount
    const discountResult = couponService.calculateDiscount(result.coupon, {
      orderAmount: orderAmount || 0,
      items: items || []
    });

    // Return safe coupon details (hide internal fields)
    const safeCoupon = {
      code: result.coupon.code,
      description: result.coupon.description,
      couponType: result.coupon.couponType,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      minOrderAmount: result.coupon.minOrderAmount,
      maxDiscountAmount: result.coupon.maxDiscountAmount
    };

    res.json({ 
      valid: true, 
      coupon: safeCoupon,
      discount: discountResult.discount,
      breakdown: discountResult.breakdown
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon preview
// @route   POST /api/coupons/preview
// @access  Public
const previewCoupon = async (req, res) => {
  try {
    const { code, sampleOrder } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const preview = await couponService.getCouponDetails(code, sampleOrder || {});

    if (!preview.found) {
      return res.status(404).json({ message: preview.error });
    }

    res.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create coupon with validation
// @route   POST /api/admin/coupons
// @access  Admin
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      couponType = 'simple',
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      buyXGetYRules,
      quantityRules,
      categoryRules,
      usageLimit,
      usagePerDay,
      usagePerTable,
      usagePerOrder,
      validFrom,
      validUntil,
      applicableBranches,
      notes
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue === undefined) {
      return res.status(400).json({ 
        message: 'Code, discount type, and discount value are required' 
      });
    }

    // Validate dates
    const from = new Date(validFrom);
    const until = new Date(validUntil);
    if (from >= until) {
      return res.status(400).json({ 
        message: 'Valid from date must be before valid until date' 
      });
    }

    // Validate discount rules based on type
    if (couponType === 'buy_get' && !buyXGetYRules?.enabled) {
      return res.status(400).json({ 
        message: 'Buy X Get Y rules required for this coupon type' 
      });
    }

    if (couponType === 'quantity_flat' && !quantityRules?.enabled) {
      return res.status(400).json({ 
        message: 'Quantity rules required for this coupon type' 
      });
    }

    if (couponType === 'category' && !categoryRules?.enabled) {
      return res.status(400).json({ 
        message: 'Category rules required for this coupon type' 
      });
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      couponType,
      discountType,
      discountValue: parseFloat(discountValue),
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      buyXGetYRules: buyXGetYRules ? {
        ...buyXGetYRules,
        enabled: true
      } : { enabled: false },
      quantityRules: quantityRules ? {
        ...quantityRules,
        enabled: true
      } : { enabled: false },
      categoryRules: categoryRules ? {
        ...categoryRules,
        enabled: true
      } : { enabled: false },
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usagePerDay: usagePerDay ? parseInt(usagePerDay) : null,
      usagePerTable: usagePerTable || false,
      usagePerOrder: usagePerOrder !== false,
      validFrom: from,
      validUntil: until,
      applicableBranches: applicableBranches || [],
      createdBy: req.admin?._id,
      notes
    });

    await coupon.save();

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupons
// @route   GET /api/admin/coupons
// @access  Admin
const getCoupons = async (req, res) => {
  try {
    const { status, search, couponType } = req.query;

    let filter = {};
    
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (couponType) filter.couponType = couponType;
    
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Admin
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating usage count directly
    delete updateData.usageCount;
    delete updateData.usageByDay;
    delete updateData.usageByTable;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Admin
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon statistics
// @route   GET /api/admin/coupons/stats
// @access  Admin
const getCouponStats = async (req, res) => {
  try {
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: '$couponType',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totals = await Coupon.countDocuments();
    const activeCount = await Coupon.countDocuments({ isActive: true });
    const totalUsage = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$usageCount' }
        }
      }
    ]);

    res.json({
      totalCoupons: totals,
      activeCoupons: activeCount,
      totalUsage: totalUsage[0]?.total || 0,
      byType: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validateCoupon,
  previewCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponStats
};
