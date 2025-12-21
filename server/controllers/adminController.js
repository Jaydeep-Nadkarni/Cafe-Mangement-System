const Branch = require('../models/Branch');
const Admin = require('../models/Admin');
const Memo = require('../models/Memo');
const Alert = require('../models/Alert');
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

/**
 * MEMO ENDPOINTS
 */

// @desc    Get all memos for a branch (admin view)
// @route   GET /api/admin/memos?branch=id
// @access  Admin
const getMemos = async (req, res) => {
  try {
    const { branch } = req.query;
    const query = { status: 'active' };
    if (branch) query.branch = branch;

    const memos = await Memo.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(memos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new memo
// @route   POST /api/admin/memos
// @access  Admin/SuperAdmin
const createMemo = async (req, res) => {
  try {
    const { branch, title, content, priority, expiresAt } = req.body;
    const adminId = req.user._id;

    const memo = await Memo.create({
      branch,
      title,
      content,
      priority,
      createdBy: adminId,
      expiresAt,
      status: 'active'
    });

    const populatedMemo = await memo.populate('createdBy', 'username email');

    res.status(201).json(populatedMemo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Acknowledge memo by manager
// @route   PUT /api/admin/memos/:id/acknowledge
// @access  Manager/Admin
const acknowledgeMemo = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const memo = await Memo.findById(id);
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Check if manager already read this memo
    const existingRead = memo.readByManagers.find(
      r => r.manager.toString() === managerId.toString()
    );

    if (existingRead) {
      // Update acknowledgement status
      existingRead.acknowledged = true;
      existingRead.acknowledgedAt = new Date();
    } else {
      // Add new read entry
      memo.readByManagers.push({
        manager: managerId,
        readAt: new Date(),
        acknowledged: true,
        acknowledgedAt: new Date()
      });
    }

    await memo.save();
    res.json({ message: 'Memo acknowledged', memo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/archive memo
// @route   DELETE /api/admin/memos/:id
// @access  Admin/SuperAdmin
const deleteMemo = async (req, res) => {
  try {
    const { id } = req.params;

    const memo = await Memo.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );

    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    res.json({ message: 'Memo archived', memo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark memo as read by manager
// @route   PUT /api/admin/memos/:id/read
// @access  Manager/Admin
const markMemoAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const memo = await Memo.findById(id);
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Check if manager already read this memo
    const existingRead = memo.readByManagers.find(
      r => r.manager.toString() === managerId.toString()
    );

    if (!existingRead) {
      // Add new read entry
      memo.readByManagers.push({
        manager: managerId,
        readAt: new Date(),
        acknowledged: false
      });

      await memo.save();
    }

    const populatedMemo = await memo.populate('readByManagers.manager', 'username email');
    res.json({ message: 'Memo marked as read', memo: populatedMemo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ALERT ENDPOINTS
 */

// @desc    Get all alerts for a branch
// @route   GET /api/admin/alerts?branch=id&dismissed=false
// @access  Admin/Manager
const getAlerts = async (req, res) => {
  try {
    const { branch, dismissed } = req.query;
    const query = {};
    
    if (branch) query.branch = branch;
    if (dismissed === 'false') query.isDismissed = false;
    else if (dismissed === 'true') query.isDismissed = true;

    const alerts = await Alert.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new alert
// @route   POST /api/admin/alerts
// @access  Admin
const createAlert = async (req, res) => {
  try {
    const { branch, type, title, message, priority, relatedId, onModel, actionUrl } = req.body;
    const adminId = req.user._id;

    const alert = await Alert.create({
      branch,
      type,
      title,
      message,
      priority: priority || 'medium',
      createdBy: adminId,
      relatedId,
      onModel,
      actionUrl
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark alert as read
// @route   PUT /api/admin/alerts/:id/read
// @access  Admin/Manager
const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dismiss alert
// @route   PUT /api/admin/alerts/:id/dismiss
// @access  Admin/Manager
const dismissAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        isDismissed: true,
        dismissedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete alert
// @route   DELETE /api/admin/alerts/:id
// @access  Admin
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted', alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update alert
// @route   PUT /api/admin/alerts/:id
// @access  Admin
const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, message, priority, actionUrl } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { type, title, message, priority, actionUrl },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  createBranch,
  getBranches,
  updateBranchStatus,
  updateBranch,
  // Memo endpoints
  getMemos,
  createMemo,
  acknowledgeMemo,
  markMemoAsRead,
  deleteMemo,
  // Alert endpoints
  getAlerts,
  createAlert,
  updateAlert,
  markAlertAsRead,
  dismissAlert,
  deleteAlert
};
