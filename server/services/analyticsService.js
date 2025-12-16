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

/**
 * Get detailed analytics for a specific branch
 */
const getBranchStats = async (branchId, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const matchStage = {
    branch: branchId,
    status: { $in: ['completed', 'paid'] }, // Include both completed and paid statuses
    createdAt: { $gte: start, $lte: end }
  };

  const [
    summary,
    revenueTrend,
    categorySales,
    topItems,
    peakHours,
    customerStats
  ] = await Promise.all([
    // 1. Summary Stats
    Order.aggregate([
      { $match: matchStage },
      { $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
          totalItemsSold: { $sum: { $size: '$items' } }
      }}
    ]),

    // 2. Revenue Trend (Daily)
    Order.aggregate([
      { $match: matchStage },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),

    // 3. Sales by Category
    Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      { $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'itemDetails'
      }},
      { $unwind: '$itemDetails' },
      { $group: {
          _id: '$itemDetails.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          count: { $sum: '$items.quantity' }
      }},
      { $sort: { revenue: -1 } }
    ]),

    // 4. Top Selling Items
    Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.menuItem',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'details'
      }},
      { $unwind: '$details' },
      { $project: {
          name: '$details.name',
          category: '$details.category',
          quantity: 1,
          revenue: 1
      }}
    ]),

    // 5. Peak Hours Analysis
    Order.aggregate([
      { $match: matchStage },
      { $project: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          total: 1
      }},
      { $group: {
          _id: { hour: '$hour' },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
      }},
      { $sort: { '_id.hour': 1 } }
    ]),

    // 6. Customer Analytics (New vs Returning)
    Order.aggregate([
      { $match: { ...matchStage, customerPhone: { $exists: true, $ne: null } } },
      { $group: {
          _id: '$customerPhone',
          visitCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastVisit: { $max: '$createdAt' }
      }},
      { $group: {
          _id: null,
          totalUniqueCustomers: { $sum: 1 },
          returningCustomers: { 
            $sum: { $cond: [{ $gt: ['$visitCount', 1] }, 1, 0] } 
          },
          avgSpendPerCustomer: { $avg: '$totalSpent' }
      }}
    ])
  ]);

  return {
    summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalItemsSold: 0 },
    revenueTrend,
    categorySales,
    topItems,
    peakHours: peakHours.map(h => ({ hour: h._id.hour, orders: h.count, revenue: h.revenue })),
    customerStats: customerStats[0] || { totalUniqueCustomers: 0, returningCustomers: 0, avgSpendPerCustomer: 0 }
  };
};

module.exports = {
  getGlobalStats,
  getBranchPerformance,
  getBranchStats
};
