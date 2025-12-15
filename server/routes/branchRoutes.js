const express = require('express');
const router = express.Router();
const { protect, requireBranch } = require('../middleware/auth');
const {
  getTables,
  getMenu,
  updateItemAvailability,
  mergeTables
} = require('../controllers/branchController');

// All routes are protected and require branch manager role
router.use(protect);
router.use(requireBranch);

router.get('/tables', getTables);
router.get('/menu', getMenu);
router.put('/menu/:id/availability', updateItemAvailability);
router.post('/tables/merge', mergeTables);

module.exports = router;
