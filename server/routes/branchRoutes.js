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
  getAnalytics,
  getAlerts,
  markAlertAsRead,
  deleteAlert,
  getMemos,
  createMemo,
  updateMemo,
  deleteMemo
} = require('../controllers/branchController');

// All routes are protected and require branch manager role
router.use(protect);
router.use(requireBranch);

router.get('/analytics', getAnalytics);

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
router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);
router.put('/tables/:id/status', updateTableStatus);
router.get('/menu', getMenu);
router.post('/menu', addMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);
router.put('/menu/:id/availability', updateItemAvailability);
router.post('/tables/merge', mergeTables);

module.exports = router;
