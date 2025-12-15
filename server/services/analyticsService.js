const Order = require('../models/Order');
const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');

/**
 * Get global analytics for the admin dashboard
 */
const getGlobalStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Parallel execution for performance
  const [
    totalRevenue,
    todayRevenue,
    monthRevenue,
    totalOrders,
    activeBranches,
    topSellingItems
  ] = await Promise.all([
    // Total Revenue (All time)
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // Today's Revenue
    Order.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // This Month's Revenue
    Order.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // Total Orders Count
    Order.countDocuments({}),

    // Active Branches Count
    Branch.countDocuments({ isActive: true }),

    // Top 5 Selling Items
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          name: '$menuItem.name',
          category: '$menuItem.category',
          totalSold: 1,
          revenue: 1
        }
      }
    ])
  ]);

  return {
    revenue: {
      total: totalRevenue[0]?.total || 0,
      today: todayRevenue[0]?.total || 0,
      month: monthRevenue[0]?.total || 0
    },
    orders: {
      total: totalOrders
    },
    branches: {
      active: activeBranches
    },
    topItems: topSellingItems
  };
};

/**
 * Get branch performance comparison
 */
const getBranchPerformance = async () => {
  return await Order.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$branch',
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$total' }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    { $unwind: '$branchInfo' },
    {
      $project: {
        branchName: '$branchInfo.name',
        revenue: 1,
        orders: 1,
        avgOrderValue: 1
      }
    },
    { $sort: { revenue: -1 } }
  ]);
};

module.exports = {
  getGlobalStats,
  getBranchPerformance
};
