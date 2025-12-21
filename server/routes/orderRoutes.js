const express = require('express');
const router = express.Router();
const { protect, requireBranch } = require('../middleware/auth');
const {
  createOrder,
  getOrder,
  addItemsToOrder,
  updateItemQuantity,
  applyCoupon,
  checkoutOrder,
  sendWhatsappBill,
  removeItemFromOrder,
  cancelOrder,
  updateOrderStatus,
  closeOrder,
  mergeOrders,
  getMergePreview,
  downloadBill
} = require('../controllers/orderController');

// All routes are protected and require branch manager role
router.use(protect);
router.use(requireBranch);

router.post('/', createOrder);
router.post('/merge/preview', getMergePreview);
router.post('/merge', mergeOrders);
router.get('/:id', getOrder);
router.get('/:id/bill', downloadBill);
router.put('/:id/items', addItemsToOrder);
router.put('/:id/items/:itemId', updateItemQuantity);
router.delete('/:id/items/:itemId', removeItemFromOrder);
router.put('/:id/coupon', applyCoupon);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/checkout', checkoutOrder);
router.post('/:id/close', closeOrder);
router.post('/:id/send-whatsapp-bill', sendWhatsappBill);

module.exports = router;
