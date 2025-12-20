const express = require('express');
const router = express.Router();
const { protect, requireBranch } = require('../middleware/auth');
const {
  getTables,
  getMenu,
  updateItemAvailability,
  mergeTables,
  getBranchDetails,
  createTable,
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
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getOrders
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

// Alerts
router.get('/alerts', getAlerts);
router.put('/alerts/:id/read', markAlertAsRead);
router.delete('/alerts/:id', deleteAlert);

// Memos
router.get('/memos', getMemos);
router.post('/memos', createMemo);
router.put('/memos/:id', updateMemo);
router.delete('/memos/:id', deleteMemo);

router.get('/details', getBranchDetails);

// Orders route
router.get('/orders', getOrders);

// Category routes
router.get('/categories', getCategories);
router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);
router.put('/tables/:id/status', updateTableStatus);
router.get('/menu', getMenu);
router.put('/menu/bulk', bulkUpdateMenuItems);
router.post('/menu', addMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);
router.post('/menu/:id/duplicate', duplicateMenuItem);
router.put('/menu/:id/availability', updateItemAvailability);
router.post('/tables/merge', mergeTables);

module.exports = router;
