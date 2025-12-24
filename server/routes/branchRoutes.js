const express = require('express');
const router = express.Router();
const { protect, requireBranch } = require('../middleware/auth');
const {
  getTables,
  getMenu,
  bulkUpdateMenuAvailability,
  updateMenuItemTemporaryChanges,
  updateItemAvailability,
  mergeTables,
  getBranchDetails,
  createTable,
  getTableLocations,
  updateTable,
  deleteTable,
  updateTableStatus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  duplicateMenuItem,
  bulkUpdateMenuItems,
  getAnalytics,
  getAlerts,
  markAlertAsRead,
  deleteAlert,
  getMemos,
  createMemo,
  updateMemo,
  deleteMemo,
  markMemoAsRead,
  acknowledgeMemo,
  getRevenueByPayment,
  getTableHeatmap,
  getItemVelocity,
  getPaymentStats,
  getPeakHours,
  getRealTimeData,
  getRevenuePattern,
  getAIData,
  getAIAnalysis,
  clearAICache,
  getAICacheStats,
  getDiscountAnalytics,
  getComplementaryAnalytics,
  getCancellationAnalytics,
  getCouponGrowth,
  getCategories,
  getDynamicCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getCustomerPreferences,
  updateCustomerPreferences,
  getBranchProfile,
  updateBranchProfile
} = require('../controllers/branchController');

// All routes are protected and require branch manager role
router.use(protect);
router.use(requireBranch);

// Analytics routes
router.get('/analytics', getAnalytics);
router.get('/analytics/revenue-by-payment', getRevenueByPayment);
router.get('/analytics/table-heatmap', getTableHeatmap);
router.get('/analytics/item-velocity', getItemVelocity);
router.get('/analytics/payment-stats', getPaymentStats);
router.get('/analytics/peak-hours', getPeakHours);
router.get('/analytics/realtime', getRealTimeData);
router.get('/analytics/revenue-pattern', getRevenuePattern);
router.get('/analytics/ai-data', getAIData);
router.get('/analytics/ai-analysis', getAIAnalysis);
router.delete('/analytics/ai-cache', clearAICache);
router.get('/analytics/ai-cache-stats', getAICacheStats);
router.get('/analytics/discounts', getDiscountAnalytics);
router.get('/analytics/complementary', getComplementaryAnalytics);
router.get('/analytics/cancellations', getCancellationAnalytics);
router.get('/analytics/coupon-growth', getCouponGrowth);

// Alerts
router.get('/alerts', getAlerts);
router.put('/alerts/:id/read', markAlertAsRead);
router.delete('/alerts/:id', deleteAlert);

// Memos
router.get('/memos', getMemos);
router.post('/memos', createMemo);
router.put('/memos/:id', updateMemo);
router.put('/memos/:id/read', markMemoAsRead);
router.put('/memos/:id/acknowledge', acknowledgeMemo);
router.delete('/memos/:id', deleteMemo);

router.get('/details', getBranchDetails);

// Orders route
router.get('/orders', getOrders);

// Category routes
router.get('/categories/dynamic', getDynamicCategories);
router.get('/categories', getCategories);
router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/tables', getTables);
router.get('/tables/locations', getTableLocations);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);
router.put('/tables/:id/status', updateTableStatus);
router.get('/menu', getMenu);
router.put('/menu/bulk-availability', bulkUpdateMenuAvailability);
router.put('/menu/bulk', bulkUpdateMenuItems);
router.post('/menu', addMenuItem);
router.put('/menu/:id/temporary-changes', updateMenuItemTemporaryChanges);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

// Customer routes
router.get('/customers/:phone', getCustomerPreferences);
router.post('/customers/preferences', updateCustomerPreferences);
router.post('/menu/:id/duplicate', duplicateMenuItem);
router.put('/menu/:id/availability', updateItemAvailability);
router.post('/tables/merge', mergeTables);

// Branch Profile routes
router.get('/profile', getBranchProfile);
router.put('/profile', updateBranchProfile);

module.exports = router;
