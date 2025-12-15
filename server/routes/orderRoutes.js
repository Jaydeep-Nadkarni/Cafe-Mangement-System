const express = require('express');
const router = express.Router();
const { protect, requireBranch } = require('../middleware/auth');
const {
  createOrder,
  getOrder,
  addItemsToOrder,
  applyCoupon,
  checkoutOrder
} = require('../controllers/orderController');

// All routes are protected and require branch manager role
router.use(protect);
router.use(requireBranch);

router.post('/', createOrder);
router.get('/:id', getOrder);
router.put('/:id/items', addItemsToOrder);
router.put('/:id/coupon', applyCoupon);
router.post('/:id/checkout', checkoutOrder);

module.exports = router;
