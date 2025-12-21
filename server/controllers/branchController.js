const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Memo = require('../models/Memo');
const Category = require('../models/Category');
const auditService = require('../services/auditService');
const { 
  emitToBranch, 
  triggerStatsUpdate,
  emitOrderChangeEvent,
  emitTableChangeEvent,
  emitAlertEvent,
  emitMemoEvent,
  emitAuditEvent,
  checkOrderEditAbuse,
  checkTableReleaseAbuse,
  checkCouponAbuse
} = require('../services/realtimeService');
const { 
  getBranchStats,
  getRevenueByPaymentMethod,
  getTableOccupancy,
  getMenuItemVelocity,
  getPaymentReliability,
  getPeakDetection,
  getRealTimeStats,
  getHourlyRevenuePattern,
  getDailyRevenuePattern,
  getAIInsights
} = require('../services/analyticsService');
const { getAIAnalysis: getAIAnalysisFromService, clearCache, getCacheStats } = require('../services/aiService');

/**
 * REAL-TIME BROADCASTING USAGE:
 * 
 * The realtimeService now provides helper functions for manual event emission:
 * 
 * 1. emitToBranch(branchId, eventType, payload)
 *    - Emit custom events to a branch room
 *    - Example: emitToBranch(branchId, 'inventory_updated', { items: updatedItems })
 * 
 * 2. triggerStatsUpdate(branchId)
 *    - Force immediate stats update for a branch
 *    - Use after critical operations that affect metrics
 * 
 * Automatic events handled by Change Streams:
 * - new_order, order_status_change, payment_confirmation (Order changes)
 * - table_occupancy_change, table_added, table_removed (Table changes)
 * - stats_update (Periodic, every 7 seconds)
 * - critical_metric_update (Instant for critical events)
 */

// Helper to get branch for logged in user
const getManagerBranch = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const branch = await Branch.findOne({ manager: userId });
  if (!branch) {
    console.error(`No branch found for manager ID: ${userId}`);
    throw new Error(`No branch assigned to this manager. User ID: ${userId}`);
  }
  return branch;
};

// @desc    Get tables for the branch (with optional filters)
// @route   GET /api/branch/tables?tableNumber=7&branch=BRANCHID
// @access  Manager or Public (for QR code scanning)
const getTables = async (req, res) => {
  try {
    const { tableNumber, branch } = req.query;
    
    let query = {};
    
    // If branch is provided in query, use it; otherwise use manager's branch
    if (branch) {
      query.branch = branch;
    } else {
      const managerBranch = await getManagerBranch(req.user._id);
      query.branch = managerBranch._id;
    }
    
    // If table number is provided, filter by it
    if (tableNumber) {
      query.tableNumber = parseInt(tableNumber);
    }
    
    const tables = await Table.find(query)
      .populate({
        path: 'currentOrders',
        select: 'orderNumber status total subtotal tax discount items customerName customerPhone chefNotes paymentStatus paymentMethod coupon createdAt',
        populate: {
          path: 'items.menuItem',
          select: 'name'
        }
      })
      .sort({ tableNumber: 1 });
    
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get menu for the branch
// @route   GET /api/branch/menu
// @access  Manager
const getMenu = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    // Get items specific to this branch or global items (branch: null)
    const menuItems = await MenuItem.find({
      $or: [
        { branch: branch._id },
        { branch: null }
      ],
      isDeleted: { $ne: true }
    }).sort({ sortOrder: 1, category: 1, name: 1 });
    
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update item availability (Inventory)
// @route   PUT /api/branch/menu/:id/availability
// @access  Manager
const updateItemAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // If it's a global item, we might need to handle branch-specific overrides
    // For now, we'll assume managers can only toggle availability of their own items
    // or we'd need a separate "BranchMenuItem" collection for overrides.
    // Assuming simple case: Manager updates the item directly.
    
    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Merge tables (Move order from one table to another)
// @route   POST /api/branch/tables/merge
// @access  Manager
const mergeTables = async (req, res) => {
  try {
    const { fromTableId, toTableId } = req.body;
    const branch = await getManagerBranch(req.user._id);

    const fromTable = await Table.findOne({ _id: fromTableId, branch: branch._id });
    const toTable = await Table.findOne({ _id: toTableId, branch: branch._id });

    if (!fromTable || !toTable) {
      return res.status(404).json({ message: 'One or both tables not found' });
    }

    if (!fromTable.currentOrders || fromTable.currentOrders.length === 0) {
      return res.status(400).json({ message: 'Source table has no active orders' });
    }

    // Move all orders from source to target table
    const orders = await Order.find({ _id: { $in: fromTable.currentOrders } });
    
    for (const order of orders) {
      order.table = toTable._id;
      await order.save();
    }

    // Update tables
    if (!toTable.currentOrders) {
      toTable.currentOrders = [];
    }
    toTable.currentOrders.push(...fromTable.currentOrders);
    toTable.status = 'occupied';
    await toTable.save();

    fromTable.currentOrders = [];
    fromTable.status = 'available';
    await fromTable.save();

    res.json({ message: 'Tables merged successfully', movedOrderCount: orders.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current branch details
// @route   GET /api/branch/details
// @access  Manager
const getBranchDetails = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const branch = await Branch.findOne({ manager: req.user._id });
    
    if (!branch) {
      console.warn(`Manager ${req.user._id} has no branch assigned`);
      return res.status(404).json({ 
        message: 'No branch assigned to this manager',
        managerId: req.user._id 
      });
    }
    
    res.json(branch);
  } catch (error) {
    console.error('Error in getBranchDetails:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new table for the branch
// @route   POST /api/branch/tables
// @access  Manager
const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location } = req.body;
    const branch = await getManagerBranch(req.user._id);

    // Validate inputs
    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'Table number and capacity are required' });
    }

    // Check if table already exists
    const existing = await Table.findOne({
      branch: branch._id,
      tableNumber: parseInt(tableNumber)
    });

    if (existing) {
      return res.status(400).json({ message: 'Table with this number already exists' });
    }

    // Create new table
    const table = new Table({
      tableNumber: parseInt(tableNumber),
      branch: branch._id,
      capacity: parseInt(capacity),
      location: location || 'indoor',
      status: 'available',
      isActive: true
    });

    const savedTable = await table.save();
    console.log('Table created:', savedTable._id, 'Number:', tableNumber);

    res.status(201).json(savedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update table details
// @route   PUT /api/branch/tables/:id
// @access  Manager
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const branch = await getManagerBranch(req.user._id);

    const table = await Table.findOne({ _id: id, branch: branch._id });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Prevent changing table number to one that already exists
    if (updates.tableNumber && updates.tableNumber !== table.tableNumber) {
      const existing = await Table.findOne({
        branch: branch._id,
        tableNumber: parseInt(updates.tableNumber)
      });
      if (existing) {
        return res.status(400).json({ message: 'Table number already exists' });
      }
    }

    Object.keys(updates).forEach(key => {
      table[key] = updates[key];
    });

    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete table
// @route   DELETE /api/branch/tables/:id
// @access  Manager
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getManagerBranch(req.user._id);

    const table = await Table.findOne({ _id: id, branch: branch._id });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.currentOrders && table.currentOrders.length > 0) {
      return res.status(400).json({ message: 'Cannot delete table with active orders' });
    }

    await Table.deleteOne({ _id: id });
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update table status
// @route   PUT /api/branch/tables/:id/status
// @access  Manager
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const branch = await getManagerBranch(req.user._id);

    // Validate status is one of the allowed values
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const table = await Table.findOne({ _id: id, branch: branch._id });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const previousStatus = table.status;

    // If manually setting to available, clear any active order references
    if (status === 'available' && table.currentOrders && table.currentOrders.length > 0) {
      table.currentOrders = [];
    }

    table.status = status;
    const updatedTable = await table.save();

    // Populate order details for response
    await updatedTable.populate({
      path: 'currentOrders',
      select: 'orderNumber status total items',
      populate: {
        path: 'items.menuItem',
        select: 'name'
      }
    });

    console.log(`Table ${table.tableNumber} status updated: ${previousStatus} → ${status}`);

    // Emit real-time update via Socket.IO if available
    if (req.io) {
      req.io.to(`branch-${branch._id}`).emit('tableStatusUpdated', {
        tableId: updatedTable._id,
        tableNumber: updatedTable.tableNumber,
        previousStatus,
        newStatus: status,
        timestamp: new Date()
      });
    }

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new menu item
// @route   POST /api/branch/menu
// @access  Manager
const addMenuItem = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const { 
      name, description, price, category, 
      isVegetarian, isVegan, isSpicy, image, sortOrder 
    } = req.body;

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      isVegetarian,
      isVegan,
      isSpicy,
      branch: branch._id, // Associate with this branch
      isAvailable: true,
      sortOrder: sortOrder || 0
    });

    const savedItem = await menuItem.save();
    
    // Emit socket event for real-time category update
    emitToBranch(branch._id, 'menu_item_added', {
      item: savedItem,
      category: savedItem.category,
      timestamp: new Date()
    });
    
    // Trigger category refresh
    emitToBranch(branch._id, 'categories_updated', {
      action: 'item_added',
      category: savedItem.category,
      timestamp: new Date()
    });
    
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/branch/menu/:id
// @access  Manager
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const branch = await getManagerBranch(req.user._id);

    const menuItem = await MenuItem.findOne({ 
      _id: id, 
      $or: [
        { branch: branch._id },
        { branch: null }
      ]
    });
    if (!menuItem) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }

    const oldCategory = menuItem.category;
    Object.keys(updates).forEach(key => {
      menuItem[key] = updates[key];
    });

    const updatedItem = await menuItem.save();
    
    // Emit socket event for real-time updates
    emitToBranch(branch._id, 'menu_item_updated', {
      item: updatedItem,
      oldCategory,
      newCategory: updatedItem.category,
      timestamp: new Date()
    });
    
    // If category changed, trigger category refresh
    if (oldCategory !== updatedItem.category) {
      emitToBranch(branch._id, 'categories_updated', {
        action: 'item_moved',
        oldCategory,
        newCategory: updatedItem.category,
        timestamp: new Date()
      });
    }
    
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete menu item (Soft Delete)
// @route   DELETE /api/branch/menu/:id
// @access  Manager
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] Attempting to delete menu item: ${id}, User: ${req.user?._id}`);
    
    const branch = await getManagerBranch(req.user._id);

    const menuItem = await MenuItem.findOne({ 
      _id: id, 
      $or: [
        { branch: branch._id },
        { branch: null }
      ]
    });
    
    if (!menuItem) {
      console.log(`[DELETE] Item ${id} not found for branch ${branch._id}`);
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }

    const deletedCategory = menuItem.category;
    menuItem.isDeleted = true;
    await menuItem.save();
    console.log(`[DELETE] Item ${id} marked as deleted successfully`);
    
    // Emit socket event for real-time category update
    emitToBranch(branch._id, 'menu_item_deleted', {
      itemId: id,
      category: deletedCategory,
      timestamp: new Date()
    });
    
    // Trigger category refresh
    emitToBranch(branch._id, 'categories_updated', {
      action: 'item_deleted',
      category: deletedCategory,
      timestamp: new Date()
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('[DELETE ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Duplicate menu item
// @route   POST /api/branch/menu/:id/duplicate
// @access  Manager
const duplicateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getManagerBranch(req.user._id);

    const originalItem = await MenuItem.findOne({ 
      _id: id, 
      $or: [
        { branch: branch._id },
        { branch: null }
      ]
    });
    if (!originalItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const newItem = new MenuItem({
      name: `${originalItem.name} (Copy)`,
      description: originalItem.description,
      price: originalItem.price,
      category: originalItem.category,
      image: originalItem.image,
      isVegetarian: originalItem.isVegetarian,
      isVegan: originalItem.isVegan,
      isSpicy: originalItem.isSpicy,
      branch: branch._id,
      isAvailable: false, // Default to unavailable for safety
      sortOrder: originalItem.sortOrder,
      isDeleted: false
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update menu items
// @route   PUT /api/branch/menu/bulk
// @access  Manager
const bulkUpdateMenuItems = async (req, res) => {
  try {
    const { items, action, value } = req.body; // items is array of IDs
    const branch = await getManagerBranch(req.user._id);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items selected' });
    }

    let update = {};
    
    switch (action) {
      case 'delete':
        update = { isDeleted: true };
        break;
      case 'availability':
        update = { isAvailable: value };
        break;
      case 'disableUntil':
        update = { disabledUntil: value, isAvailable: false };
        break;
      case 'category':
        update = { category: value };
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await MenuItem.updateMany(
      { 
        _id: { $in: items }, 
        $or: [
          { branch: branch._id },
          { branch: null }
        ]
      },
      { $set: update }
    );

    res.json({ message: `Updated ${result.modifiedCount} items`, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get branch analytics
// @route   GET /api/branch/analytics
// @access  Manager
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const branch = await getManagerBranch(req.user._id);
    
    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(end.getDate() - 30));

    const stats = await getBranchStats(branch._id, start, end);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ALERTS & MEMOS ---

// @desc    Get all alerts
// @route   GET /api/branch/alerts
// @access  Manager
const getAlerts = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const alerts = await Alert.find({ branch: branch._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark alert as read
// @route   PUT /api/branch/alerts/:id/read
// @access  Manager
const markAlertAsRead = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, branch: branch._id },
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete alert
// @route   DELETE /api/branch/alerts/:id
// @access  Manager
const deleteAlert = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const result = await Alert.deleteOne({ _id: req.params.id, branch: branch._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get memos
// @route   GET /api/branch/memos
// @access  Manager
const getMemos = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const memos = await Memo.find({ branch: branch._id })
      .populate('createdBy', 'username email')
      .populate('readByManagers.manager', 'username email')
      .sort({ createdAt: -1 });
    res.json(memos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create memo
// @route   POST /api/branch/memos
// @access  Manager
const createMemo = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const { title, content, priority } = req.body;
    
    const memo = await Memo.create({
      branch: branch._id,
      title,
      content,
      priority,
      createdBy: req.user._id
    });

    // Populate for response
    const populatedMemo = await Memo.findById(memo._id)
      .populate('createdBy', 'username email')
      .populate('readByManagers.manager', 'username email');
    
    // Create an alert notification for this memo
    const alert = await Alert.create({
      branch: branch._id,
      type: 'memo',
      title: `New Memo: ${title}`,
      message: content,
      priority: priority === 'high' ? 'high' : 'medium',
      createdBy: req.user._id,
      onModel: 'Memo',
      relatedId: memo._id
    });

    // Emit real-time event to branch
    if (global.io) {
      const room = `branch_${branch._id}`;
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

// @desc    Update memo
// @route   PUT /api/branch/memos/:id
// @access  Manager
const updateMemo = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const { title, content, priority } = req.body;
    
    const memo = await Memo.findOneAndUpdate(
      { _id: req.params.id, branch: branch._id },
      { title, content, priority },
      { new: true }
    );
    
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete memo
// @route   DELETE /api/branch/memos/:id
// @access  Manager
const deleteMemo = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const result = await Memo.deleteOne({ _id: req.params.id, branch: branch._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Memo not found' });
    res.json({ message: 'Memo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark memo as read by manager
// @route   PUT /api/branch/memos/:id/read
// @access  Manager
const markMemoAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const memo = await Memo.findById(req.params.id);
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    
    // Check if already in readByManagers
    const existingRead = memo.readByManagers.find(r => r.manager?.toString() === userId.toString());
    
    if (!existingRead) {
      memo.readByManagers.push({
        manager: userId,
        readAt: new Date(),
        acknowledged: false
      });
      await memo.save();
    }
    
    const updatedMemo = await Memo.findById(memo._id)
      .populate('createdBy', 'username email')
      .populate('readByManagers.manager', 'username email');
    
    res.json({ memo: updatedMemo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Acknowledge memo (mark as read and acknowledged)
// @route   PUT /api/branch/memos/:id/acknowledge
// @access  Manager
const acknowledgeMemo = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const memo = await Memo.findById(req.params.id);
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    
    // Find or create read entry
    let readEntry = memo.readByManagers.find(r => r.manager?.toString() === userId.toString());
    
    if (!readEntry) {
      readEntry = {
        manager: userId,
        readAt: new Date(),
        acknowledged: true,
        acknowledgedAt: new Date()
      };
      memo.readByManagers.push(readEntry);
    } else {
      readEntry.acknowledged = true;
      readEntry.acknowledgedAt = new Date();
    }
    
    await memo.save();
    
    const updatedMemo = await Memo.findById(memo._id)
      .populate('createdBy', 'username email')
      .populate('readByManagers.manager', 'username email');
    
    res.json({ memo: updatedMemo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADVANCED ANALYTICS ENDPOINTS ====================

// @desc    Get revenue breakdown by payment method
// @route   GET /api/branch/analytics/revenue-by-payment?range=today
// @access  Manager
const getRevenueByPayment = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || 'today';
    
    const data = await getRevenueByPaymentMethod(branch._id, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get table occupancy heatmap
// @route   GET /api/branch/analytics/table-heatmap?range=today
// @access  Manager
const getTableHeatmap = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || 'today';
    
    const data = await getTableOccupancy(branch._id, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get menu item velocity (sales rate)
// @route   GET /api/branch/analytics/item-velocity?range=today
// @access  Manager
const getItemVelocity = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || 'today';
    
    console.log(`[getItemVelocity] Branch: ${branch._id}, TimeRange: ${timeRange}`);
    const items = await getMenuItemVelocity(branch._id, timeRange);
    console.log(`[getItemVelocity] Returning ${items.length} items`);
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ items: items || [] });
  } catch (error) {
    console.error('[getItemVelocity] Error:', error.message);
    console.error(error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment success/failure statistics
// @route   GET /api/branch/analytics/payment-stats?range=7d
// @access  Manager
const getPaymentStats = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || '7d';
    
    const data = await getPaymentReliability(branch._id, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get peak hours detection
// @route   GET /api/branch/analytics/peak-hours?range=7d
// @access  Manager
const getPeakHours = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || '7d';
    
    const data = await getPeakDetection(branch._id, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get real-time dashboard stats
// @route   GET /api/branch/analytics/realtime?range=1h
// @access  Manager
const getRealTimeData = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || '1h';
    
    const data = await getRealTimeStats(branch._id, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue pattern (hourly or daily)
// @route   GET /api/branch/analytics/revenue-pattern?range=today&type=hourly
// @access  Manager
const getRevenuePattern = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || 'today';
    const type = req.query.type || 'hourly';
    
    console.log(`[Controller] getRevenuePattern - Branch: ${branch._id}, Range: ${timeRange}, Type: ${type}`);
    
    const data = type === 'hourly' 
      ? await getHourlyRevenuePattern(branch._id, timeRange)
      : await getDailyRevenuePattern(branch._id, timeRange);
    
    // For daily data, add label property
    const pattern = type === 'daily' 
      ? data.map(item => ({ ...item, label: item.date }))
      : data;  // Hourly already has label from service
    
    console.log(`[Controller] getRevenuePattern response pattern length: ${pattern.length}`);
    
    res.json({ pattern, type, timeRange });
  } catch (error) {
    console.error('[Controller] getRevenuePattern error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI insights for the branch
// @route   GET /api/branch/analytics/ai-data?range=7d
// @access  Manager
const getAIData = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || '7d';
    
    const aiInsights = await getAIInsights(branch._id, timeRange);
    
    res.json(aiInsights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI analysis with Gemini insights (10 sections)
// @route   GET /api/branch/analytics/ai-analysis?range=7d
// @access  Manager
const getAIAnalysis = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || '7d';
    const forceRefresh = req.query.refresh === 'true';
    
    // Clear cache if force refresh requested
    if (forceRefresh) {
      await clearCache(branch._id, timeRange);
    }
    
    const analysis = await getAIAnalysisFromService(branch._id, branch.name, timeRange);
    
    res.json({
      success: true,
      data: analysis,
      branch: {
        id: branch._id,
        name: branch.name
      },
      timeRange,
      cached: analysis.cached || false
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to generate AI analysis',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Clear AI analysis cache for branch
// @route   DELETE /api/branch/analytics/ai-cache
// @access  Manager
const clearAICache = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const timeRange = req.query.range || null;
    
    const deletedCount = await clearCache(branch._id, timeRange);
    
    res.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get AI cache statistics
// @route   GET /api/branch/analytics/ai-cache-stats
// @access  Manager
const getAICacheStats = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const stats = await getCacheStats(branch._id);
    
    res.json({
      success: true,
      data: stats,
      branch: {
        id: branch._id,
        name: branch.name
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Get dynamic categories derived from menu items
// @route   GET /api/branch/categories/dynamic
// @access  Manager
const getDynamicCategories = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const { includeEmpty = 'false' } = req.query;
    
    // 1. Get ALL active categories metadata first
    const categoryMetadata = await Category.find({
      $or: [
        { branch: branch._id },
        { branch: null }
      ],
      isActive: true
    });

    // 2. Aggregate stats from menu items
    const categoriesWithStats = await MenuItem.aggregate([
      {
        $match: {
          $or: [
            { branch: branch._id },
            { branch: null }
          ],
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: ['$isAvailable', 1, 0] }
          },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    // 3. Merge metadata with stats
    // We map over metadata to ensure we include categories even if they have no items
    const categories = categoryMetadata.map(meta => {
      const stats = categoriesWithStats.find(s => s._id === meta.slug);
      return {
        slug: meta.slug,
        name: meta.name,
        color: meta.color || '#6B7280',
        icon: meta.icon || 'tag',
        sortOrder: meta.sortOrder || 0,
        totalItems: stats?.totalItems || 0,
        availableItems: stats?.availableItems || 0,
        avgPrice: stats?.avgPrice || 0,
        minPrice: stats?.minPrice || 0,
        maxPrice: stats?.maxPrice || 0,
        hasMetadata: true,
        _id: meta._id
      };
    });

    // 4. Filter out empty categories if requested
    // If includeEmpty is 'true', we return everything.
    // If 'false', we only return categories that have at least one item (totalItems > 0)
    // The user requirement says "Customer menu: hide empty categories (no active items)"
    // So for customer facing, we might want availableItems > 0.
    // But this endpoint is for Manager. Manager might want to see categories with items even if they are unavailable.
    // Let's stick to totalItems > 0 for "non-empty" in manager context, or availableItems > 0?
    // Usually "empty" means no items.
    
    const filteredCategories = includeEmpty === 'true' 
      ? categories 
      : categories.filter(c => c.totalItems > 0);

    // Sort by sortOrder, then by name
    filteredCategories.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });

    res.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching dynamic categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories for branch
// @route   GET /api/branch/categories
// @access  Manager
const getCategories = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const categories = await Category.find({
      $or: [
        { branch: branch._id },
        { branch: null }
      ],
      isActive: true
    }).sort({ sortOrder: 1, name: 1 });
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new category
// @route   POST /api/branch/categories
// @access  Manager
const addCategory = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const { name, color, icon, sortOrder } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = new Category({
      name,
      slug,
      branch: branch._id,
      color: color || '#6B7280',
      icon: icon || 'tag',
      sortOrder: sortOrder || 0
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/branch/categories/:id
// @access  Manager
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getManagerBranch(req.user._id);
    const { name, color, icon, sortOrder } = req.body;

    const category = await Category.findOne({ 
      _id: id, 
      $or: [
        { branch: branch._id },
        { branch: null }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/branch/categories/:id
// @access  Manager
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getManagerBranch(req.user._id);

    // Check if category has items
    const itemCount = await MenuItem.countDocuments({ 
      category: id,
      isDeleted: { $ne: true }
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${itemCount} items. Please reassign or delete items first.` 
      });
    }

    const category = await Category.findOne({ 
      _id: id, 
      branch: branch._id 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found or unauthorized' });
    }

    category.isActive = false;
    await category.save();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders for the branch with filters
// @route   GET /api/branch/orders?timeFilter=1h&startDate=&endDate=
// @access  Manager
const getOrders = async (req, res) => {
  try {
    const { timeFilter, startDate, endDate } = req.query;
    const branch = await getManagerBranch(req.user._id);

    // Build time-based query
    let dateQuery = {};
    const now = new Date();

    if (timeFilter) {
      let startTime;
      switch (timeFilter) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '3h':
          startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case 'today':
          startTime = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'custom':
          if (startDate) {
            startTime = new Date(startDate);
          }
          if (endDate) {
            dateQuery.createdAt = {
              $gte: startTime || new Date(0),
              $lte: new Date(endDate)
            };
          } else if (startTime) {
            dateQuery.createdAt = { $gte: startTime };
          }
          break;
        default:
          // No time filter, show all
          break;
      }

      if (timeFilter !== 'custom' && startTime) {
        dateQuery.createdAt = { $gte: startTime };
      }
    }

    // Fetch all orders (paid, unpaid, partial) - exclude only merged/cancelled
    const orders = await Order.find({
      branch: branch._id,
      status: { $nin: ['merged', 'cancelled'] },
      ...dateQuery
    })
      .populate({
        path: 'table',
        select: 'tableNumber'
      })
      .populate({
        path: 'items.menuItem',
        select: 'name price'
      })
      .lean();

    // Custom sorting: unpaid first (oldest first), then paid (newest first)
    const sortedOrders = orders.sort((a, b) => {
      // Unpaid orders first
      if (a.paymentStatus === 'unpaid' && b.paymentStatus !== 'unpaid') return -1;
      if (a.paymentStatus !== 'unpaid' && b.paymentStatus === 'unpaid') return 1;

      // Within unpaid: oldest first
      if (a.paymentStatus === 'unpaid' && b.paymentStatus === 'unpaid') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      // Within paid: newest first
      if (a.paymentStatus === 'paid' && b.paymentStatus === 'paid') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      // Default: by creation time
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTables,
  getMenu,
  updateItemAvailability,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  duplicateMenuItem,
  bulkUpdateMenuItems,
  mergeTables,
  getBranchDetails,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
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
  getCategories,
  getDynamicCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getOrders
};
