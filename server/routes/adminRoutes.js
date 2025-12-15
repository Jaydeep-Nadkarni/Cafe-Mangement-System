const express = require('express');
const router = express.Router();
const { 
  getAnalytics, 
  createBranch, 
  getBranches, 
  updateBranchStatus,
  updateBranch
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

module.exports = router;
