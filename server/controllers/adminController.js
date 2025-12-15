const Branch = require('../models/Branch');
const analyticsService = require('../services/analyticsService');

// @desc    Get global analytics
// @route   GET /api/admin/analytics
// @access  Admin/SuperAdmin
const getAnalytics = async (req, res) => {
  try {
    const globalStats = await analyticsService.getGlobalStats();
    const branchPerformance = await analyticsService.getBranchPerformance();

    res.json({
      global: globalStats,
      branchPerformance
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};

// @desc    Create a new branch
// @route   POST /api/admin/branches
// @access  Admin/SuperAdmin
const createBranch = async (req, res) => {
  try {
    const { name, address, phone, email, manager, operatingHours } = req.body;

    const branchExists = await Branch.findOne({ name });
    if (branchExists) {
      return res.status(400).json({ message: 'Branch already exists' });
    }

    const branch = await Branch.create({
      name,
      address,
      phone,
      email,
      manager,
      operatingHours
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Create Branch Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all branches
// @route   GET /api/admin/branches
// @access  Admin/SuperAdmin
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({})
      .populate('manager', 'username email')
      .sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches' });
  }
};

// @desc    Update branch status (Enable/Disable)
// @route   PUT /api/admin/branches/:id/status
// @access  Admin/SuperAdmin
const updateBranchStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    branch.isActive = isActive;
    await branch.save();

    res.json({ message: `Branch ${isActive ? 'enabled' : 'disabled'} successfully`, branch });
  } catch (error) {
    res.status(500).json({ message: 'Error updating branch status' });
  }
};

// @desc    Update branch details
// @route   PUT /api/admin/branches/:id
// @access  Admin/SuperAdmin
const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  createBranch,
  getBranches,
  updateBranchStatus,
  updateBranch
};
