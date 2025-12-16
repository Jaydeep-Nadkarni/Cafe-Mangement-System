const Branch = require('../models/Branch');
const Admin = require('../models/Admin');
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
    const { name, branchCode, email, password, address, mobileNumber, operatingHours } = req.body;

    // 1. Check if branch exists
    const branchExists = await Branch.findOne({ $or: [{ name }, { branchCode }] });
    if (branchExists) {
      return res.status(400).json({ message: 'Branch with this name or code already exists' });
    }

    // 2. Check if user exists or create new manager
    let manager = await Admin.findOne({ email });
    if (manager) {
      // If user exists, ensure they are a manager
      if (manager.role !== 'manager') {
        return res.status(400).json({ message: 'User exists but is not a manager' });
      }
    } else {
      // Create new manager
      manager = await Admin.create({
        username: `Manager-${branchCode}`,
        email,
        password,
        role: 'manager'
      });
    }

    // 3. Create Branch
    const branch = await Branch.create({
      name,
      branchCode,
      address,
      mobileNumber: mobileNumber || null,
      email,
      manager: manager._id,
      operatingHours
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Create Branch Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all branches (with optional code filter)
// @route   GET /api/admin/branches?code=BRANCHCODE
// @access  Admin/SuperAdmin
const getBranches = async (req, res) => {
  try {
    const { code } = req.query;
    let query = {};
    
    // If branch code is provided, filter by it
    if (code) {
      query.branchCode = code.toUpperCase();
    }
    
    const branches = await Branch.find(query)
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
