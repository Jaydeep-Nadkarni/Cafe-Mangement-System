const Order = require('../models/Order');
const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');
const Table = require('../models/Table');

/**
 * ANALYTICS SERVICE
 * 
 * Provides comprehensive analytics and reporting functionality for the cafe management system.
 * 
 * TIME RANGES SUPPORTED:
 * - '15min': Last 15 minutes (real-time monitoring)
 * - '1h': Last 1 hour (short-term trends)
 * - '6h': Last 6 hours (shift analysis)
 * - 'today': Today from midnight (daily performance)
 * - '7d': Last 7 days (weekly trends)
 * - '30d': Last 30 days (monthly trends)
 * 
 * ENDPOINTS:
 * - GET /api/branch/analytics/revenue-by-payment?range=today
 *   Returns revenue breakdown by payment method (cash, card, UPI, online)
 * 
 * - GET /api/branch/analytics/table-heatmap?range=today
 *   Returns table utilization rates, orders per table, and revenue per table
 * 
 * - GET /api/branch/analytics/item-velocity?range=today
 *   Returns menu item sales velocity (items/hour), trending items
 * 
 * - GET /api/branch/analytics/payment-stats?range=7d
 *   Returns payment success/failure rates by method
 * 
 * - GET /api/branch/analytics/peak-hours?range=7d
 *   Returns peak hours detection and hourly patterns
 * 
 * - GET /api/branch/analytics/realtime?range=1h
 *   Returns real-time dashboard stats (revenue, active orders, table occupancy)
 * 
 * - GET /api/branch/analytics/revenue-pattern?range=today&type=hourly
 *   Returns hourly or daily revenue patterns for charts
 */

/**
 * Parse time range and return start/end dates
 */
const getTimeRange = (range) => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (range) {
    case '15min':
      start.setMinutes(now.getMinutes() - 15);
      break;
    case '1h':
      start.setHours(now.getHours() - 1);
      break;
    case '6h':
      start.setHours(now.getHours() - 6);
      break;
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to today
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

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
    totalBranches,
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

    // Total Branches Count
    Branch.countDocuments({}),

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
      active: activeBranches,
      total: totalBranches
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

  // Calculate growth compared to previous period
  const periodLength = end - start;
  const prevStart = new Date(start.getTime() - periodLength);
  const prevEnd = new Date(start.getTime() - 1);

  const prevMatchStage = {
    branch: branchId,
    status: { $in: ['completed', 'paid'] },
    createdAt: { $gte: prevStart, $lte: prevEnd }
  };

  const [prevSummary] = await Order.aggregate([
    { $match: prevMatchStage },
    { $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 }
    }}
  ]);

  const prev = prevSummary || { totalRevenue: 0, totalOrders: 0 };
  const curr = summary[0] || { totalRevenue: 0, totalOrders: 0 };

  const growth = {
    revenue: prev.totalRevenue > 0 
      ? ((curr.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100 
      : curr.totalRevenue > 0 ? 100 : 0,
    orders: prev.totalOrders > 0 
      ? ((curr.totalOrders - prev.totalOrders) / prev.totalOrders) * 100 
      : curr.totalOrders > 0 ? 100 : 0
  };

  return {
    summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalItemsSold: 0 },
    growth,
    revenueTrend,
    categorySales,
    topItems,
    peakHours: peakHours.map(h => ({ hour: h._id.hour, orders: h.count, revenue: h.revenue })),
    customerStats: customerStats[0] || { totalUniqueCustomers: 0, returningCustomers: 0, avgSpendPerCustomer: 0 }
  };
};

/**
 * Get revenue by payment method
 */
const getRevenueByPaymentMethod = async (branchId, timeRange = 'today') => {
  const { start, end } = getTimeRange(timeRange);

  const matchStage = {
    branch: branchId,
    paymentStatus: 'paid',
    createdAt: { $gte: start, $lte: end }
  };

  const result = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        method: { $ifNull: ['$_id', 'cash'] },
        revenue: '$total',
        transactions: '$count'
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  return result.map(r => ({
    name: r.method,
    value: r.revenue,
    count: r.transactions
  }));
};

/**
 * Get table occupancy heatmap
 */
const getTableOccupancy = async (branchId, timeRange = 'today') => {
  const { start, end } = getTimeRange(timeRange);

  // Get all tables for the branch
  const tables = await Table.find({ branch: branchId }).lean();

  // Get order frequency per table
  const tableStats = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        table: { $exists: true, $ne: null },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$table',
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
        avgOrderValue: { $avg: '$total' }
      }
    },
    {
      $lookup: {
        from: 'tables',
        localField: '_id',
        foreignField: '_id',
        as: 'tableInfo'
      }
    },
    { $unwind: '$tableInfo' },
    {
      $project: {
        tableNumber: '$tableInfo.tableNumber',
        capacity: '$tableInfo.capacity',
        location: '$tableInfo.location',
        orders: 1,
        revenue: 1,
        avgOrderValue: 1,
        utilizationRate: {
          $multiply: [
            { $divide: ['$orders', { $size: tables }] },
            100
          ]
        }
      }
    },
    { $sort: { orders: -1 } }
  ]);

  return tableStats;
};

/**
 * Get menu item velocity (sales rate)
 */
const getMenuItemVelocity = async (branchId, timeRange = 'today') => {
  const { start, end } = getTimeRange(timeRange);
  const hoursDiff = Math.max(1, (end - start) / (1000 * 60 * 60));

  const result = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        status: { $in: ['completed', 'paid', 'in_progress'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        totalQuantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'menuitems',
        localField: '_id',
        foreignField: '_id',
        as: 'item'
      }
    },
    { $unwind: '$item' },
    {
      $project: {
        name: '$item.name',
        category: '$item.category',
        totalSold: '$totalQuantity',
        revenue: 1,
        orderCount: 1,
        velocity: { $divide: ['$totalQuantity', hoursDiff] }, // Items per hour
        avgItemsPerOrder: { $divide: ['$totalQuantity', '$orderCount'] }
      }
    },
    { $sort: { velocity: -1 } },
    { $limit: 20 }
  ]);

  return result;
};

/**
 * Get payment success/failure rates
 */
const getPaymentReliability = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);

  const stats = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          method: '$paymentMethod',
          status: '$paymentStatus'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    },
    {
      $group: {
        _id: '$_id.method',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
            amount: '$totalAmount'
          }
        }
      }
    }
  ]);

  return stats.map(stat => {
    const paid = stat.statuses.find(s => s.status === 'paid') || { count: 0, amount: 0 };
    const unpaid = stat.statuses.find(s => s.status === 'unpaid') || { count: 0, amount: 0 };
    const total = paid.count + unpaid.count;

    return {
      method: stat._id || 'cash',
      successRate: total > 0 ? (paid.count / total) * 100 : 0,
      successCount: paid.count,
      failureCount: unpaid.count,
      totalAttempts: total,
      successAmount: paid.amount,
      failureAmount: unpaid.amount
    };
  });
};

/**
 * Detect peak hours and patterns
 */
const getPeakDetection = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);

  const hourlyData = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        status: { $in: ['completed', 'paid'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $project: {
        hour: { $hour: '$createdAt' },
        dayOfWeek: { $dayOfWeek: '$createdAt' },
        total: 1
      }
    },
    {
      $group: {
        _id: { hour: '$hour', day: '$dayOfWeek' },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    },
    { $sort: { '_id.hour': 1 } }
  ]);

  // Calculate hourly averages
  const hourlyAvg = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        status: { $in: ['completed', 'paid'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $project: {
        hour: { $hour: '$createdAt' },
        total: 1
      }
    },
    {
      $group: {
        _id: '$hour',
        avgOrders: { $avg: 1 },
        avgRevenue: { $avg: '$total' },
        totalOrders: { $sum: 1 }
      }
    },
    { $sort: { totalOrders: -1 } }
  ]);

  const peakHours = hourlyAvg.slice(0, 5).map(h => ({
    hour: h._id,
    orders: h.totalOrders,
    avgRevenue: h.avgRevenue
  }));

  return {
    hourlyPattern: hourlyAvg,
    peakHours,
    detailedPattern: hourlyData
  };
};

/**
 * Get real-time stats dashboard
 */
const getRealTimeStats = async (branchId, timeRange = '1h') => {
  const { start, end } = getTimeRange(timeRange);

  const [revenue, orders, tableOccupancy, activeOrders] = await Promise.all([
    // Revenue in time range
    Order.aggregate([
      {
        $match: {
          branch: branchId,
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]),

    // Order status breakdown
    Order.aggregate([
      {
        $match: {
          branch: branchId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Table occupancy
    Table.aggregate([
      {
        $match: { branch: branchId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Active orders count
    Order.countDocuments({
      branch: branchId,
      status: { $in: ['pending', 'in_progress'] }
    })
  ]);

  const revenueData = revenue[0] || { total: 0, count: 0 };
  const ordersByStatus = orders.reduce((acc, o) => {
    acc[o._id] = o.count;
    return acc;
  }, {});

  const tablesByStatus = tableOccupancy.reduce((acc, t) => {
    acc[t._id] = t.count;
    return acc;
  }, {});

  return {
    revenue: revenueData.total,
    transactions: revenueData.count,
    orders: ordersByStatus,
    tables: tablesByStatus,
    activeOrders,
    timeRange
  };
};

/**
 * Get hourly revenue pattern (for charts)
 */
const getHourlyRevenuePattern = async (branchId, timeRange = 'today') => {
  const { start, end } = getTimeRange(timeRange);

  const data = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        paymentStatus: 'paid',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing hours with 0
  const result = [];
  for (let hour = 0; hour < 24; hour++) {
    const existing = data.find(d => d._id === hour);
    result.push({
      hour,
      revenue: existing?.revenue || 0,
      orders: existing?.orders || 0
    });
  }

  return result;
};

/**
 * Get daily revenue pattern (for charts)
 */
const getDailyRevenuePattern = async (branchId, timeRange = '30d') => {
  const { start, end } = getTimeRange(timeRange);

  const data = await Order.aggregate([
    {
      $match: {
        branch: branchId,
        paymentStatus: 'paid',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return data.map(d => ({
    date: d._id,
    revenue: d.revenue,
    orders: d.orders
  }));
};

module.exports = {
  getGlobalStats,
  getBranchPerformance,
  getBranchStats,
  getTimeRange,
  getRevenueByPaymentMethod,
  getTableOccupancy,
  getMenuItemVelocity,
  getPaymentReliability,
  getPeakDetection,
  getRealTimeStats,
  getHourlyRevenuePattern,
  getDailyRevenuePattern
};
