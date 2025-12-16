const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Memo = require('../models/Memo');
const { getBranchStats } = require('../services/analyticsService');

// Helper to get branch for logged in user
const getManagerBranch = async (userId) => {
  const branch = await Branch.findOne({ manager: userId });
  if (!branch) {
    throw new Error('No branch assigned to this manager');
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
        path: 'currentOrder',
        select: 'orderNumber status total items',
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
      ]
    }).sort({ category: 1, name: 1 });
    
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

    if (!fromTable.currentOrder) {
      return res.status(400).json({ message: 'Source table has no active order' });
    }

    if (toTable.currentOrder) {
      return res.status(400).json({ message: 'Target table is already occupied' });
    }

    // Move order
    const order = await Order.findById(fromTable.currentOrder);
    order.table = toTable._id;
    await order.save();

    // Update tables
    toTable.currentOrder = order._id;
    toTable.status = 'occupied';
    await toTable.save();

    fromTable.currentOrder = null;
    fromTable.status = 'available';
    await fromTable.save();

    res.json({ message: 'Tables merged successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current branch details
// @route   GET /api/branch/details
// @access  Manager
const getBranchDetails = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    res.json(branch);
  } catch (error) {
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

    if (table.currentOrder) {
      return res.status(400).json({ message: 'Cannot delete table with active order' });
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

    const table = await Table.findOne({ _id: id, branch: branch._id });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // If manually setting to available, ensure no active order
    if (status === 'available' && table.currentOrder) {
      // Optional: Could force close order here, but safer to require order closure first
      // For now, we'll just clear the reference if the user forces it
      table.currentOrder = null;
    }

    table.status = status;
    await table.save();
    res.json(table);
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
      isVegetarian, isVegan, isSpicy, image 
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
      isAvailable: true
    });

    const savedItem = await menuItem.save();
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

    const menuItem = await MenuItem.findOne({ _id: id, branch: branch._id });
    if (!menuItem) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }

    Object.keys(updates).forEach(key => {
      menuItem[key] = updates[key];
    });

    const updatedItem = await menuItem.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/branch/menu/:id
// @access  Manager
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await getManagerBranch(req.user._id);

    const result = await MenuItem.deleteOne({ _id: id, branch: branch._id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }

    res.json({ message: 'Item deleted successfully' });
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
    const memos = await Memo.find({ branch: branch._id }).sort({ createdAt: -1 });
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
    
    res.status(201).json(memo);
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

module.exports = {
  getTables,
  getMenu,
  updateItemAvailability,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
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
  deleteMemo
};
