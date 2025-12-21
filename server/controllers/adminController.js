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
      .populate('readByManagers.manager', 'username email')
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

    // Create an alert notification for this memo
    const alert = await Alert.create({
      branch,
      type: 'memo',
      title: `New Memo: ${title}`,
      message: content,
      priority: priority === 'high' ? 'high' : 'medium',
      createdBy: adminId,
      onModel: 'Memo',
      relatedId: memo._id
    });

    // Emit real-time event to branch
    if (global.io) {
      const room = `branch_${branch}`;
      global.io.to(room).emit('memo_created', {
        memo: populatedMemo,
        alert: alert
      });
    }

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

// ============================================
// CUSTOMER BROADCAST ENDPOINTS
// ============================================

/**
 * Send a broadcast to customers
 * POST /api/admin/broadcast/send
 */
const sendBroadcast = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const {
      title,
      content,
      broadcastType,
      targetAudience,
      branches,
      channels = ['whatsapp'],
      subscriptionType = null,
      minOrderValue = 0,
      maxOrderValue = null,
      lastOrderWithinDays = null,
      excludePhones = [],
      scheduleTime = null
    } = req.body;

    // Validate required fields
    if (!title || !content || !broadcastType || !targetAudience) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, content, broadcastType, targetAudience'
      });
    }

    // Validate broadcast type
    const validBroadcastTypes = ['offer', 'announcement', 'event', 'menu_launch'];
    if (!validBroadcastTypes.includes(broadcastType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid broadcast type. Allowed: ${validBroadcastTypes.join(', ')}`
      });
    }

    // Validate target audience
    const validAudiences = ['all_customers', 'opt_in_only', 'vip_customers', 'recent_customers'];
    if (!validAudiences.includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        error: `Invalid target audience. Allowed: ${validAudiences.join(', ')}`
      });
    }

    // Create broadcast log
    const BroadcastLog = require('../models/BroadcastLog');
    const broadcastLog = new BroadcastLog({
      title,
      content,
      broadcastType,
      targetAudience,
      branches: branches || [],
      channels,
      filters: {
        minOrderValue,
        maxOrderValue,
        lastOrderWithinDays,
        excludePhones
      },
      createdBy: adminId,
      status: scheduleTime ? 'scheduled' : 'draft'
    });

    await broadcastLog.save();

    // If scheduled for later, queue it
    if (scheduleTime) {
      const scheduledTime = new Date(scheduleTime);
      const now = new Date();
      const delay = scheduledTime.getTime() - now.getTime();

      if (delay > 0) {
        // Queue the broadcast (could use Bull or similar)
        setTimeout(async () => {
          try {
            const whatsappService = require('../services/whatsappService');
            await whatsappService.sendBroadcast({
              broadcastLogId: broadcastLog._id,
              title,
              content,
              broadcastType,
              targetAudience,
              branches,
              channels,
              filters: {
                minOrderValue,
                maxOrderValue,
                lastOrderWithinDays,
                excludePhones
              },
              subscriptionType
            });
          } catch (error) {
            console.error('Scheduled broadcast error:', error);
            broadcastLog.status = 'failed';
            broadcastLog.errors = [{
              phone: 'system',
              error: error.message
            }];
            await broadcastLog.save();
          }
        }, delay);

        return res.status(200).json({
          success: true,
          message: 'Broadcast scheduled successfully',
          broadcastId: broadcastLog._id,
          scheduledTime
        });
      }
    }

    // Send immediately
    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.sendBroadcast({
      broadcastLogId: broadcastLog._id,
      title,
      content,
      broadcastType,
      targetAudience,
      branches,
      channels,
      filters: {
        minOrderValue,
        maxOrderValue,
        lastOrderWithinDays,
        excludePhones
      },
      subscriptionType
    });

    res.status(200).json({
      success: result.success,
      broadcastId: broadcastLog._id,
      stats: result.stats,
      errors: result.errors
    });
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get broadcast logs with pagination
 * GET /api/admin/broadcast/logs
 */
const getBroadcastLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = null, broadcastType = null } = req.query;
    const BroadcastLog = require('../models/BroadcastLog');

    const query = {};
    if (status) query.status = status;
    if (broadcastType) query.broadcastType = broadcastType;

    const logs = await BroadcastLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email');

    const total = await BroadcastLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get broadcast details with tracking stats
 * GET /api/admin/broadcast/logs/:id
 */
const getBroadcastDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const BroadcastLog = require('../models/BroadcastLog');

    const broadcast = await BroadcastLog.findById(id)
      .populate('createdBy', 'name email');

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        error: 'Broadcast not found'
      });
    }

    res.status(200).json({
      success: true,
      data: broadcast
    });
  } catch (error) {
    console.error('Get details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel a scheduled broadcast
 * PUT /api/admin/broadcast/:id/cancel
 */
const cancelBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const BroadcastLog = require('../models/BroadcastLog');

    const broadcast = await BroadcastLog.findById(id);

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        error: 'Broadcast not found'
      });
    }

    if (broadcast.status !== 'scheduled' && broadcast.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel broadcast with status: ${broadcast.status}`
      });
    }

    broadcast.status = 'cancelled';
    await broadcast.save();

    res.status(200).json({
      success: true,
      message: 'Broadcast cancelled successfully',
      data: broadcast
    });
  } catch (error) {
    console.error('Cancel broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Handle customer opt-out request
 * POST /api/admin/broadcast/opt-out
 */
const handleCustomerOptOut = async (req, res) => {
  try {
    const { phone, channels = ['whatsapp'], reason = null } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.handleOptOut(phone, channels, reason);

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Opt-out error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get broadcast statistics
 * GET /api/admin/broadcast/stats
 */
const getBroadcastStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const BroadcastLog = require('../models/BroadcastLog');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stats = await BroadcastLog.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate },
          status: { $in: ['sent', 'failed'] }
        }
      },
      {
        $group: {
          _id: '$broadcastType',
          count: { $sum: 1 },
          totalSent: { $sum: '$stats.sent' },
          totalFailed: { $sum: '$stats.failed' },
          totalDelivered: { $sum: '$stats.delivered' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Overall stats
    const overallStats = await BroadcastLog.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate },
          status: { $in: ['sent', 'failed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalBroadcasts: { $sum: 1 },
          totalRecipients: { $sum: '$stats.totalRecipients' },
          totalSent: { $sum: '$stats.sent' },
          totalFailed: { $sum: '$stats.failed' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: stats,
        overall: overallStats[0] || {
          totalBroadcasts: 0,
          totalRecipients: 0,
          totalSent: 0,
          totalFailed: 0
        },
        period: { days }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
  deleteAlert,
  // Broadcasting endpoints
  sendBroadcast,
  getBroadcastLogs,
  getBroadcastDetails,
  cancelBroadcast,
  handleCustomerOptOut,
  getBroadcastStats
};
