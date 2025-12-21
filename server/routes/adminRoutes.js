const express = require('express');
const router = express.Router();
const { 
  getAnalytics, 
  createBranch, 
  getBranches, 
  updateBranchStatus,
  updateBranch,
  getMemos,
  createMemo,
  acknowledgeMemo,
  markMemoAsRead,
  deleteMemo,
  getAlerts,
  createAlert,
  updateAlert,
  markAlertAsRead,
  dismissAlert,
  deleteAlert,
  sendBroadcast,
  getBroadcastLogs,
  getBroadcastDetails,
  cancelBroadcast,
  handleCustomerOptOut,
  getBroadcastStats
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// All routes are protected and require admin privileges
router.use(protect);
router.use(requireAdmin);

// Analytics Routes
router.get('/analytics', getAnalytics);

// Branch Management Routes
router.route('/branches')
  .get(getBranches)
  .post(createBranch);

router.route('/branches/:id')
  .put(updateBranch);

router.put('/branches/:id/status', updateBranchStatus);

// Memo Routes
router.route('/memos')
  .get(getMemos)
  .post(createMemo);

router.put('/memos/:id/acknowledge', acknowledgeMemo);
router.put('/memos/:id/read', markMemoAsRead);
router.delete('/memos/:id', deleteMemo);

// Alert Routes
router.route('/alerts')
  .get(getAlerts)
  .post(createAlert);

router.put('/alerts/:id/read', markAlertAsRead);
router.put('/alerts/:id/dismiss', dismissAlert);
router.put('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);

// Customer Broadcast Routes
router.route('/broadcast/send')
  .post(sendBroadcast);

router.route('/broadcast/logs')
  .get(getBroadcastLogs);

router.route('/broadcast/logs/:id')
  .get(getBroadcastDetails);

router.route('/broadcast/:id/cancel')
  .put(cancelBroadcast);

router.route('/broadcast/opt-out')
  .post(handleCustomerOptOut);

router.route('/broadcast/stats')
  .get(getBroadcastStats);

module.exports = router;
