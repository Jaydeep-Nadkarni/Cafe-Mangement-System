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

// @desc    Get tables for the branch
// @route   GET /api/branch/tables
// @access  Manager
const getTables = async (req, res) => {
  try {
    const branch = await getManagerBranch(req.user._id);
    const tables = await Table.find({ branch: branch._id })
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

module.exports = {
  getTables,
  getMenu,
  updateItemAvailability,
  mergeTables,
  getBranchDetails
};
