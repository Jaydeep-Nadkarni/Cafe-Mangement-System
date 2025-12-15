const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

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

module.exports = {
  getTables,
  getMenu,
  updateItemAvailability,
  mergeTables,
  getBranchDetails,
  createTable
};
