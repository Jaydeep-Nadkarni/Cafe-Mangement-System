const Order = require('../models/Order');
const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Admin = require('../models/Admin');
const Table = require('../models/Table');
const Coupon = require('../models/Coupon');
const GameSession = require('../models/GameSession');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute default TTL

/**
 * Helper to get cached data or fetch fresh
 */
const getCachedData = async (key, fetchFn, ttl = CACHE_TTL) => {
  if (cache.has(key)) {
    const { data, expiry } = cache.get(key);
    if (Date.now() < expiry) {
      return data;
    }
    cache.delete(key);
  }

  const data = await fetchFn();
  cache.set(key, { data, expiry: Date.now() + ttl });
  return data;
};

/**
 * Helper to convert branchId to ObjectId
 */
const toObjectId = (id) => {
  if (!id) return null;
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};

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
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // Today's Revenue
    Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          paidAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // This Month's Revenue
    Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          paidAt: { $gte: startOfMonth }
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
      { $match: { paymentStatus: 'paid' } },
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
    { $match: { paymentStatus: 'paid' } },
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
  
  const branchObjectId = toObjectId(branchId);

  const matchStage = {
    branch: branchObjectId,
    paymentStatus: 'paid',
    paidAt: { $gte: start, $lte: end }
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
    branch: branchObjectId,
    paymentStatus: 'paid',
    paidAt: { $gte: prevStart, $lte: prevEnd }
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
  const cacheKey = `revenue_payment_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    const matchStage = {
      branch: branchObjectId,
      paymentStatus: 'paid',
      $or: [
        { paidAt: { $gte: start, $lte: end } },
        { 
          $and: [
            { paidAt: { $exists: false } }, 
            { createdAt: { $gte: start, $lte: end } }
          ] 
        },
        { 
          $and: [
            { paidAt: null }, 
            { createdAt: { $gte: start, $lte: end } }
          ] 
        }
      ]
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
          _id: 0,
          method: { $ifNull: ['$_id', 'cash'] },
          revenue: '$total',
          transactions: '$count'
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    return result;
  });
};

/**
 * Get table occupancy heatmap
 */
const getTableOccupancy = async (branchId, timeRange = 'today') => {
  const cacheKey = `table_occupancy_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Get all tables for the branch
    const tables = await Table.find({ branch: branchObjectId }).lean();

    // Get order frequency per table
    const tableStats = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
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
              { $divide: ['$orders', '$tableInfo.capacity'] },
              100
            ]
          }
        }
      },
      { $sort: { orders: -1 } }
    ]);

    return tableStats;
  });
};

/**
 * Get menu item velocity (sales rate)
 */
const getMenuItemVelocity = async (branchId, timeRange = 'today') => {
  // Clear cache to always get fresh data
  const cacheKey = `menu_velocity_${branchId}_${timeRange}`;
  cache.delete(cacheKey);
  
  const { start, end } = getTimeRange(timeRange);
  const hoursDiff = Math.max(1, (end - start) / (1000 * 60 * 60));
  const branchObjectId = toObjectId(branchId);

  console.log(`[getMenuItemVelocity] Branch: ${branchObjectId}, Range: ${timeRange}, Hours: ${hoursDiff}`);
  console.log(`[getMenuItemVelocity] Time: ${start.toISOString()} to ${end.toISOString()}`);

  // Check if there are any orders in this period
  const orderCount = await Order.countDocuments({
    branch: branchObjectId,
    status: { $ne: 'cancelled' },
    $or: [
      { paidAt: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } }
    ]
  });
  console.log(`[getMenuItemVelocity] Found ${orderCount} orders in period`);

  if (orderCount === 0) {
    console.log(`[getMenuItemVelocity] No data found, returning empty array`);
    return [];
  }

  const result = await Order.aggregate([
    {
      $match: {
        branch: branchObjectId,
        status: { $ne: 'cancelled' },
        $or: [
          { paidAt: { $gte: start, $lte: end } },
          { createdAt: { $gte: start, $lte: end } }
        ]
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        totalQuantity: { $sum: '$items.quantity' },
        revenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              { $multiply: ['$items.quantity', '$items.price'] },
              0
            ]
          } 
        },
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
    {
      $match: {
        item: { $ne: [] }  // Only include items that exist
      }
    },
    { $unwind: '$item' },
    {
      $project: {
        _id: 0,
        name: '$item.name',
        category: '$item.category',
        totalSold: '$totalQuantity',
        revenue: 1,
        orderCount: 1,
        velocity: { $divide: ['$totalQuantity', hoursDiff] },
        avgItemsPerOrder: { $divide: ['$totalQuantity', '$orderCount'] }
      }
    },
    { $sort: { velocity: -1 } },
    { $limit: 20 }
  ]);

  console.log(`[getMenuItemVelocity] Returning ${result.length} items`);
  return result;
};

/**
 * Get payment success/failure rates
 */
const getPaymentReliability = async (branchId, timeRange = '7d') => {
  const cacheKey = `payment_reliability_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    const stats = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    const paid = stats.find(s => s._id === 'paid') || { count: 0, totalAmount: 0 };
    const unpaid = stats.find(s => s._id === 'unpaid') || { count: 0, totalAmount: 0 };
    const total = paid.count + unpaid.count;

    return {
      successRate: total > 0 ? (paid.count / total) * 100 : 0,
      successCount: paid.count,
      failedCount: 0, // We don't have a 'failed' status in the enum, maybe cancelled?
      pendingCount: unpaid.count,
      totalRevenue: paid.totalAmount,
      totalAttempts: total
    };
  });
};

/**
 * Detect peak hours and patterns
 */
const getPeakDetection = async (branchId, timeRange = '7d') => {
  const cacheKey = `peak_detection_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Timezone offset for IST (UTC+5:30) - adjust if different
    const timezoneOffsetHours = 5.5; // IST is UTC+5:30

    const hourlyData = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          paymentStatus: 'paid',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          hour: { $hour: { $add: ['$paidAt', timezoneOffsetHours * 60 * 60 * 1000] } },
          dayOfWeek: { $dayOfWeek: '$paidAt' },
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
          branch: branchObjectId,
          paymentStatus: 'paid',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          hour: { $hour: { $add: ['$paidAt', timezoneOffsetHours * 60 * 60 * 1000] } },
          total: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          avgRevenue: { $avg: '$total' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }  // Sort by hour ascending for chart display
    ]);

    const peakHours = [...hourlyAvg]
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5)
      .map(h => ({
        hour: h._id,
        orders: h.totalOrders,
        avgRevenue: h.avgRevenue
      }));

    // Fill in all 24 hours for complete chart display
    const hourlyPattern = [];
    for (let h = 0; h < 24; h++) {
      const existing = hourlyAvg.find(d => d._id === h);
      hourlyPattern.push({
        hour: `${h}:00`,
        orders: existing?.totalOrders || 0,
        revenue: existing?.totalRevenue || 0
      });
    }

    return {
      hourlyPattern,
      peakHours,
      detailedPattern: hourlyData
    };
  });
};

/**
 * Get real-time stats dashboard
 */
const getRealTimeStats = async (branchId, timeRange = '1h') => {
  const cacheKey = `realtime_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    
    // Ensure branchId is an ObjectId
    const branchObjectId = toObjectId(branchId);

    console.log(`[Analytics] getRealTimeStats - Branch: ${branchObjectId}, Range: ${timeRange}, Start: ${start}, End: ${end}`);

    const [revenue, orders, tableOccupancy, activeOrders] = await Promise.all([
      // Revenue in time range (paid orders only, using paidAt)
      Order.aggregate([
        {
          $match: {
            branch: branchObjectId,
            paymentStatus: 'paid',
            $or: [
              { paidAt: { $gte: start, $lte: end } },
              { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: start, $lte: end } }] },
              { $and: [{ paidAt: null }, { createdAt: { $gte: start, $lte: end } }] }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),

      // Order status breakdown (non-cancelled)
      Order.aggregate([
        {
          $match: {
            branch: branchObjectId,
            status: { $ne: 'cancelled' },
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
          $match: { branch: branchObjectId }
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
        branch: branchObjectId,
        status: { $in: ['pending', 'in_progress'] }
      })
    ]);

    const revenueData = revenue[0] || { total: 0 };
    const ordersByStatus = orders.reduce((acc, o) => {
      acc[o._id] = o.count;
      return acc;
    }, {});

    const tablesByStatus = tableOccupancy.reduce((acc, t) => {
      acc[t._id] = t.count;
      return acc;
    }, {});

    const totalRevenue = revenueData.total || 0;
    const totalOrders = orders.reduce((sum, o) => sum + o.count, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    console.log(`[Analytics] Results - Revenue: ${totalRevenue}, Orders: ${totalOrders}, Active: ${activeOrders}`);

  return {
    // Legacy fields
    revenue: totalRevenue,
    transactions: totalOrders,
    // New fields expected by frontend
    totalRevenue,
    totalOrders,
    avgOrderValue,
    // Other data
    orders: ordersByStatus,
    tables: tablesByStatus,
    activeOrders,
    timeRange
  };
  }, 30 * 1000); // 30s TTL for realtime stats
};

/**
 * Get hourly revenue pattern (for charts)
 */
const getHourlyRevenuePattern = async (branchId, timeRange = 'today') => {
  const cacheKey = `hourly_pattern_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    
    // Ensure branchId is an ObjectId
    const branchObjectId = toObjectId(branchId);

    console.log(`[Analytics] getHourlyRevenuePattern - Branch: ${branchObjectId}, Range: ${timeRange}, Start: ${start}, End: ${end}`);

    // Timezone offset for IST (UTC+5:30) - adjust if different
    const timezoneOffsetHours = 5.5; // IST is UTC+5:30

    const data = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          paymentStatus: 'paid',
          $or: [
            { paidAt: { $gte: start, $lte: end } },
            { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: start, $lte: end } }] },
            { $and: [{ paidAt: null }, { createdAt: { $gte: start, $lte: end } }] }
          ]
        }
      },
      {
        $group: {
          // Add timezone offset to convert UTC to IST
          _id: { 
            $hour: { 
              $add: [
                { $ifNull: ['$paidAt', '$createdAt'] }, 
                timezoneOffsetHours * 60 * 60 * 1000
              ] 
            } 
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log(`[Analytics] getHourlyRevenuePattern raw data:`, JSON.stringify(data));

    // Fill in missing hours with 0
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const existing = data.find(d => d._id === hour);
      result.push({
        hour,
        label: `${hour}:00`,
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0
      });
    }

    return result;
  });
};

/**
 * Get minute-by-minute revenue pattern (for short time ranges)
 */
const getMinuteRevenuePattern = async (branchId, timeRange = '15min') => {
  const cacheKey = `minute_pattern_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);
    const timezoneOffsetHours = 5.5;

    const data = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          paymentStatus: 'paid',
          $or: [
            { paidAt: { $gte: start, $lte: end } },
            { $and: [{ paidAt: { $exists: false } }, { createdAt: { $gte: start, $lte: end } }] },
            { $and: [{ paidAt: null }, { createdAt: { $gte: start, $lte: end } }] }
          ]
        }
      },
      {
        $group: {
          _id: {
            $minute: {
              $add: [
                { $ifNull: ['$paidAt', '$createdAt'] },
                timezoneOffsetHours * 60 * 60 * 1000
              ]
            }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing minutes for the range
    const result = [];
    const startMinute = start.getMinutes();
    const endMinute = end.getMinutes();
    
    // This is a bit tricky if it crosses an hour boundary, but for 15min it's usually fine
    // A better way is to iterate by minute from start to end
    let current = new Date(start);
    while (current <= end) {
      const minute = current.getMinutes();
      const existing = data.find(d => d._id === minute);
      result.push({
        minute,
        label: `${current.getHours()}:${minute.toString().padStart(2, '0')}`,
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0
      });
      current.setMinutes(current.getMinutes() + 1);
    }

    return result;
  });
};

/**
 * Get daily revenue pattern (for charts)
 */
const getDailyRevenuePattern = async (branchId, timeRange = '30d') => {
  const cacheKey = `daily_pattern_${branchId}_${timeRange}`;
  
  return getCachedData(cacheKey, async () => {
    const { start, end } = getTimeRange(timeRange);
    
    // Ensure branchId is an ObjectId
    const branchObjectId = toObjectId(branchId);

    const data = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          paymentStatus: 'paid',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
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
  });
};

/**
 * Calculate performance score (0-100)
 * Based on: revenue growth, order completion rate, table turnover, customer retention
 */
const calculatePerformanceScore = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const periodLength = end - start;
  const prevStart = new Date(start.getTime() - periodLength);
  const prevEnd = new Date(start.getTime());
  const branchObjectId = toObjectId(branchId);

  const [current, previous] = await Promise.all([
    Order.aggregate([
      { $match: { branch: branchObjectId, paymentStatus: 'paid', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { branch: branchObjectId, paymentStatus: 'paid', paidAt: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }
    ])
  ]);

  const curr = current[0] || { revenue: 0, orders: 0 };
  const prev = previous[0] || { revenue: 0, orders: 0 };

  // Revenue growth (0-40 points)
  const revenueGrowth = prev.revenue > 0 ? ((curr.revenue - prev.revenue) / prev.revenue) * 100 : 0;
  const revenueScore = Math.min(40, Math.max(0, (revenueGrowth + 20) * 2));

  // Order completion rate (0-30 points)
  const allOrders = await Order.countDocuments({ branch: branchObjectId, createdAt: { $gte: start, $lte: end } });
  const completedOrders = await Order.countDocuments({ branch: branchObjectId, paymentStatus: 'paid', paidAt: { $gte: start, $lte: end } });
  const completionRate = allOrders > 0 ? (completedOrders / allOrders) * 100 : 0;
  const completionScore = (completionRate / 100) * 30;

  // Table turnover (0-20 points)
  const avgOrderValue = curr.orders > 0 ? curr.revenue / curr.orders : 0;
  const targetAOV = 500; // Target average order value
  const aovScore = Math.min(20, (avgOrderValue / targetAOV) * 20);

  // Customer retention (0-10 points)
  const uniqueCustomers = await Order.aggregate([
    { $match: { branch: branchObjectId, customerPhone: { $exists: true, $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$customerPhone' } },
    { $count: 'total' }
  ]);
  const totalCustomers = uniqueCustomers[0]?.total || 1;
  const returningCustomers = await Order.aggregate([
    { $match: { branch: branchObjectId, customerPhone: { $exists: true, $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$customerPhone', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ]);
  const retentionRate = totalCustomers > 0 ? ((returningCustomers[0]?.total || 0) / totalCustomers) * 100 : 0;
  const retentionScore = (retentionRate / 100) * 10;

  const totalScore = Math.round(revenueScore + completionScore + aovScore + retentionScore);

  return {
    score: totalScore,
    breakdown: {
      revenueGrowth: { score: Math.round(revenueScore), growth: revenueGrowth.toFixed(2) },
      completionRate: { score: Math.round(completionScore), rate: completionRate.toFixed(2) },
      avgOrderValue: { score: Math.round(aovScore), value: avgOrderValue.toFixed(2) },
      retention: { score: Math.round(retentionScore), rate: retentionRate.toFixed(2) }
    }
  };
};

/**
 * Calculate efficiency score (0-100)
 * Based on: table utilization, menu diversity, peak hour efficiency, payment success rate
 */
const calculateEfficiencyScore = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const branchObjectId = toObjectId(branchId);

  // Table utilization (0-30 points)
  const tables = await Table.countDocuments({ branch: branchObjectId });
  const ordersPerTable = await Order.aggregate([
    { $match: { branch: branchObjectId, table: { $exists: true }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$table' } },
    { $count: 'total' }
  ]);
  const utilizationRate = tables > 0 ? ((ordersPerTable[0]?.total || 0) / tables) * 100 : 0;
  const utilizationScore = Math.min(30, (utilizationRate / 100) * 30);

  // Menu diversity (0-20 points)
  const uniqueItems = await Order.aggregate([
    { $match: { branch: branchObjectId, createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.menuItem' } },
    { $count: 'total' }
  ]);
  const menuItems = await MenuItem.countDocuments({ branch: branchObjectId });
  const diversityRate = menuItems > 0 ? ((uniqueItems[0]?.total || 0) / menuItems) * 100 : 0;
  const diversityScore = Math.min(20, (diversityRate / 100) * 20);

  // Peak hour efficiency (0-25 points)
  const peakHours = await Order.aggregate([
    { $match: { branch: branchObjectId, createdAt: { $gte: start, $lte: end } } },
    { $project: { hour: { $hour: '$createdAt' }, total: 1 } },
    { $group: { _id: '$hour', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { orders: -1 } },
    { $limit: 5 }
  ]);
  const avgPeakOrders = peakHours.length > 0 ? peakHours.reduce((sum, h) => sum + h.orders, 0) / peakHours.length : 0;
  const peakScore = Math.min(25, (avgPeakOrders / 10) * 25);

  // Payment success rate (0-25 points)
  const payments = await Payment.aggregate([
    { $match: { branch: branchObjectId, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const successCount = payments.find(p => p._id === 'success')?.count || 0;
  const totalPayments = payments.reduce((sum, p) => sum + p.count, 0) || 1;
  const successRate = (successCount / totalPayments) * 100;
  const paymentScore = (successRate / 100) * 25;

  const totalScore = Math.round(utilizationScore + diversityScore + peakScore + paymentScore);

  return {
    score: totalScore,
    breakdown: {
      tableUtilization: { score: Math.round(utilizationScore), rate: utilizationRate.toFixed(2) },
      menuDiversity: { score: Math.round(diversityScore), rate: diversityRate.toFixed(2) },
      peakEfficiency: { score: Math.round(peakScore), avgPeakOrders: avgPeakOrders.toFixed(2) },
      paymentSuccess: { score: Math.round(paymentScore), rate: successRate.toFixed(2) }
    }
  };
};

/**
 * Calculate risk score (0-100, where 100 = highest risk)
 * Based on: payment failures, order cancellations, low table utilization, declining revenue
 */
const calculateRiskScore = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const branchObjectId = toObjectId(branchId);
  const periodLength = end - start;
  const prevStart = new Date(start.getTime() - periodLength);
  const prevEnd = new Date(start.getTime());

  // Payment failure rate (0-25 risk points)
  const payments = await Payment.aggregate([
    { $match: { branch: branchObjectId, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const failureCount = payments.find(p => p._id === 'failed')?.count || 0;
  const totalPayments = payments.reduce((sum, p) => sum + p.count, 0) || 1;
  const failureRate = (failureCount / totalPayments) * 100;
  const paymentRisk = Math.min(25, (failureRate / 100) * 25);

  // Order cancellation rate (0-25 risk points)
  const totalOrders = await Order.countDocuments({ branch: branchObjectId, createdAt: { $gte: start, $lte: end } });
  const cancelledOrders = await Order.countDocuments({ branch: branchObjectId, status: 'cancelled', createdAt: { $gte: start, $lte: end } });
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const cancellationRisk = Math.min(25, (cancellationRate / 100) * 25);

  // Revenue decline (0-25 risk points)
  const [current, previous] = await Promise.all([
    Order.aggregate([
      { $match: { branch: branchObjectId, paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } }
    ]),
    Order.aggregate([
      { $match: { branch: branchObjectId, paymentStatus: 'paid', createdAt: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } }
    ])
  ]);

  const currRevenue = current[0]?.revenue || 0;
  const prevRevenue = previous[0]?.revenue || 1;
  const revenueDrop = prevRevenue > 0 ? Math.max(0, ((prevRevenue - currRevenue) / prevRevenue) * 100) : 0;
  const revenueRisk = Math.min(25, (revenueDrop / 100) * 25);

  // Low table utilization (0-25 risk points)
  const tables = await Table.countDocuments({ branch: branchObjectId });
  const activeTableCount = await Order.aggregate([
    { $match: { branch: branchObjectId, table: { $exists: true }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$table' } },
    { $count: 'total' }
  ]);
  const utilizationRate = tables > 0 ? ((activeTableCount[0]?.total || 0) / tables) * 100 : 0;
  const utilizationRisk = Math.max(0, 25 - (utilizationRate / 100) * 25);

  const totalRisk = Math.round(paymentRisk + cancellationRisk + revenueRisk + utilizationRisk);

  return {
    score: totalRisk,
    breakdown: {
      paymentFailures: { score: Math.round(paymentRisk), rate: failureRate.toFixed(2) },
      cancellations: { score: Math.round(cancellationRisk), rate: cancellationRate.toFixed(2) },
      revenueDeclline: { score: Math.round(revenueRisk), drop: revenueDrop.toFixed(2) },
      lowUtilization: { score: Math.round(utilizationRisk), rate: (100 - utilizationRate).toFixed(2) }
    }
  };
};

/**
 * Calculate coupon uplift metrics
 * Measures the impact of coupon usage on sales and customer behavior
 */
const calculateCouponUplift = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const branchObjectId = toObjectId(branchId);

  // Orders with coupons
  const ordersWithCoupons = await Order.aggregate([
    { $match: { branch: branchObjectId, coupon: { $exists: true, $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' }, avgValue: { $avg: '$total' } } }
  ]);

  // Orders without coupons
  const ordersWithoutCoupons = await Order.aggregate([
    { $match: { branch: branchObjectId, coupon: { $exists: false }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' }, avgValue: { $avg: '$total' } } }
  ]);

  const withCoupons = ordersWithCoupons[0] || { count: 0, revenue: 0, avgValue: 0 };
  const withoutCoupons = ordersWithoutCoupons[0] || { count: 0, revenue: 0, avgValue: 0 };

  // Most effective coupons
  const topCoupons = await Order.aggregate([
    { $match: { branch: branchObjectId, coupon: { $exists: true, $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$coupon', count: { $sum: 1 }, totalDiscount: { $sum: '$discountAmount' }, revenue: { $sum: '$total' } } },
    { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'couponInfo' } },
    { $unwind: '$couponInfo' },
    { $project: { code: '$couponInfo.code', uses: '$count', discount: '$totalDiscount', revenue: '$revenue', avgOrderValue: { $divide: ['$revenue', '$count'] } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  const upliftPercentage = withoutCoupons.avgValue > 0 
    ? ((withCoupons.avgValue - withoutCoupons.avgValue) / withoutCoupons.avgValue) * 100 
    : 0;

  return {
    orderMetrics: {
      withCoupon: { count: withCoupons.count, revenue: Math.round(withCoupons.revenue), avgOrderValue: Math.round(withCoupons.avgValue) },
      withoutCoupon: { count: withoutCoupons.count, revenue: Math.round(withoutCoupons.revenue), avgOrderValue: Math.round(withoutCoupons.avgValue) }
    },
    upliftMetrics: {
      orderValueUplift: upliftPercentage.toFixed(2) + '%',
      couponPenetration: ((withCoupons.count / (withCoupons.count + withoutCoupons.count)) * 100).toFixed(2) + '%',
      totalDiscountsGiven: Math.round(await Order.aggregate([
        { $match: { branch: branchObjectId, discountAmount: { $gt: 0 }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$discountAmount' } } }
      ]).then(r => r[0]?.total || 0))
    },
    topCoupons
  };
};

/**
 * Calculate hybrid forecasts using moving averages
 * Predicts future trends based on historical patterns
 */
const calculateForecast = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const branchObjectId = toObjectId(branchId);

  // Get daily data for the period
  const dailyData = await Order.aggregate([
    { $match: { branch: branchObjectId, paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Calculate moving averages (3-day and 7-day)
  const calculateMA = (data, period) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(data[i]);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const avgRevenue = slice.reduce((sum, d) => sum + d.revenue, 0) / period;
        const avgOrders = slice.reduce((sum, d) => sum + d.orders, 0) / period;
        result.push({
          ...data[i],
          ma: { revenue: Math.round(avgRevenue), orders: Math.round(avgOrders) }
        });
      }
    }
    return result;
  };

  const ma3 = calculateMA(dailyData, 3);
  const ma7 = calculateMA(dailyData, 7);

  // Forecast next 3 days based on latest MA7
  const lastEntry = ma7[ma7.length - 1] || { revenue: 0, orders: 0, ma: { revenue: 0, orders: 0 } };
  const forecast = [];
  for (let i = 1; i <= 3; i++) {
    forecast.push({
      day: i,
      predictedRevenue: Math.round(lastEntry.ma?.revenue || lastEntry.revenue),
      predictedOrders: Math.round(lastEntry.ma?.orders || lastEntry.orders),
      confidence: (95 - i * 5) + '%'
    });
  }

  // Calculate trend
  const lastValues = dailyData.slice(-3);
  const avgLast3 = lastValues.reduce((sum, d) => sum + d.revenue, 0) / Math.max(1, lastValues.length);
  const trend = lastValues.length > 0 && dailyData.length > 3
    ? (((avgLast3 - (dailyData[dailyData.length - 4]?.revenue || 0)) / (dailyData[dailyData.length - 4]?.revenue || 1)) * 100).toFixed(2)
    : 0;

  return {
    recentTrend: trend + '%',
    movingAverages: {
      ma3Day: lastEntry.ma?.revenue || lastEntry.revenue,
      ma7Day: ma7[ma7.length - 1]?.ma?.revenue || dailyData[dailyData.length - 1]?.revenue || 0
    },
    forecast,
    trendDirection: parseFloat(trend) > 0 ? 'Upward' : parseFloat(trend) < 0 ? 'Downward' : 'Stable'
  };
};

/**
 * Calculate deviations from expected performance
 * Identifies anomalies and unexpected behavior
 */
const calculateDeviations = async (branchId, timeRange = '7d') => {
  const { start, end } = getTimeRange(timeRange);
  const branchObjectId = toObjectId(branchId);

  // Get hourly revenue
  const hourlyData = await Order.aggregate([
    { $match: { branch: branchObjectId, paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
    { $project: { hour: { $hour: '$createdAt' }, total: 1 } },
    { $group: { _id: '$hour', revenue: { $avg: '$total' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Calculate mean and standard deviation
  const revenues = hourlyData.map(h => h.revenue);
  const mean = revenues.reduce((a, b) => a + b, 0) / Math.max(1, revenues.length);
  const variance = revenues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / Math.max(1, revenues.length);
  const stdDev = Math.sqrt(variance);

  // Identify deviations (> 1.5 std dev)
  const deviations = hourlyData.filter(h => Math.abs(h.revenue - mean) > stdDev * 1.5).map(h => ({
    hour: h._id,
    revenue: Math.round(h.revenue),
    count: h.count,
    deviation: ((h.revenue - mean) / mean * 100).toFixed(2) + '%',
    type: h.revenue > mean ? 'High' : 'Low'
  }));

  return {
    baseline: { meanRevenue: Math.round(mean), stdDeviation: Math.round(stdDev) },
    anomalies: deviations,
    anomalyCount: deviations.length
  };
};

/**
 * Get comprehensive AI insights for branch
 * Combines all metrics, scores, and forecasts
 */
const getAIInsights = async (branchId, timeRange = '7d') => {
  if (!branchId) throw new Error('Branch ID is required');

  const [
    performanceScore,
    efficiencyScore,
    riskScore,
    couponUplift,
    forecast,
    deviations
  ] = await Promise.all([
    calculatePerformanceScore(branchId, timeRange),
    calculateEfficiencyScore(branchId, timeRange),
    calculateRiskScore(branchId, timeRange),
    calculateCouponUplift(branchId, timeRange),
    calculateForecast(branchId, timeRange),
    calculateDeviations(branchId, timeRange)
  ]);

  // Generate AI recommendations
  const recommendations = [];

  // Performance recommendations
  if (performanceScore.score < 60) {
    recommendations.push({
      priority: 'high',
      area: 'Performance',
      insight: 'Branch performance is below target',
      action: 'Focus on revenue growth and customer retention strategies'
    });
  }

  // Efficiency recommendations
  if (efficiencyScore.score < 60) {
    recommendations.push({
      priority: 'high',
      area: 'Efficiency',
      insight: 'Operations could be more efficient',
      action: 'Optimize table utilization and peak hour management'
    });
  }

  // Risk recommendations
  if (riskScore.score > 40) {
    recommendations.push({
      priority: 'critical',
      area: 'Risk',
      insight: 'Potential risks detected in operations',
      action: 'Review payment failures and order cancellations'
    });
  }

  // Coupon recommendations
  const couponPenetration = parseFloat(couponUplift.upliftMetrics.couponPenetration);
  if (couponPenetration < 15) {
    recommendations.push({
      priority: 'medium',
      area: 'Promotions',
      insight: 'Low coupon usage',
      action: 'Consider promoting available coupons to increase customer engagement'
    });
  }

  // Forecast recommendations
  const trendDirection = forecast.trendDirection;
  if (trendDirection === 'Downward') {
    recommendations.push({
      priority: 'high',
      area: 'Forecasting',
      insight: 'Revenue trend is declining',
      action: 'Implement targeted promotions and menu optimization'
    });
  }

  return {
    timeRange,
    generatedAt: new Date(),
    scores: {
      performance: performanceScore,
      efficiency: efficiencyScore,
      risk: riskScore,
      overallHealth: Math.round((performanceScore.score + efficiencyScore.score + (100 - riskScore.score)) / 3)
    },
    metrics: {
      couponUplift,
      forecast,
      deviations
    },
    recommendations,
    summary: {
      bestPerformer: performanceScore.breakdown.revenueGrowth.growth > 10 ? 'Revenue Growth' : 'Stable Operations',
      needsAttention: riskScore.score > 40 ? 'Risk Management' : recommendations.length > 0 ? recommendations[0].area : 'All Systems Normal'
    }
  };
};

/**
 * Get or create stats cache for incremental updates
 */
const getStatsCache = async (branchId, timeRange = 'today') => {
  const { StatsCache } = require('../models/AICache');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let cache = await StatsCache.findOne({
    branch: branchId,
    timeRange,
    date: today
  });
  
  if (!cache) {
    // Create new cache with fresh aggregates
    const stats = await getRealTimeStats(branchId, timeRange);
    
    cache = new StatsCache({
      branch: branchId,
      date: today,
      timeRange,
      aggregates: {
        totalRevenue: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        avgOrderValue: stats.avgOrderValue || 0,
        totalItemsSold: stats.totalItemsSold || 0,
        paymentBreakdown: {},
        categoryBreakdown: {},
        hourlyPattern: [],
        topItems: []
      },
      delta: { revenue: 0, orders: 0, items: 0 },
      expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await cache.save();
  }
  
  return cache;
};

/**
 * Apply incremental delta to cached stats
 * Called when order is created, paid, or refunded
 */
const applyStatsDelta = async (branchId, deltaData) => {
  const { StatsCache } = require('../models/AICache');
  
  try {
    const cache = await getStatsCache(branchId, 'today');
    
    if (cache) {
      cache.applyDelta(deltaData);
      await cache.save();
      
      console.log(`[Analytics] Applied delta to cache: ${JSON.stringify(deltaData)}`);
      return cache.aggregates;
    }
  } catch (error) {
    console.error('[Analytics] Error applying stats delta:', error);
  }
  
  return null;
};

/**
 * Get stats with cached aggregates + real-time delta
 */
const getStatsWithCache = async (branchId, timeRange = 'today') => {
  const cache = await getStatsCache(branchId, timeRange);
  
  // Return cached aggregates with delta applied
  return {
    ...cache.aggregates,
    _cached: true,
    _lastUpdated: cache.lastUpdated,
    _delta: cache.delta
  };
};

/**
 * Get discount analytics
 * Returns total discounts, discount trends, and breakdown by coupon
 */
const getDiscountAnalytics = async (branchId, timeRange = 'today') => {
  try {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Get orders with discounts
    const orders = await Order.find({
      branch: branchObjectId,
      status: { $ne: 'cancelled' },
      paymentStatus: 'paid',
      createdAt: { $gte: start, $lte: end },
      discount: { $gt: 0 }
    }).populate('coupon', 'code discountValue discountType');

    // Calculate total discounts
    const totalDiscounts = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

    // Breakdown by coupon
    const discountByCoupon = {};
    const discountTrends = [];
    
    orders.forEach(order => {
      const couponCode = order.coupon?.code || 'Manual Discount';
      if (!discountByCoupon[couponCode]) {
        discountByCoupon[couponCode] = { code: couponCode, amount: 0, count: 0 };
      }
      discountByCoupon[couponCode].amount += order.discount;
      discountByCoupon[couponCode].count += 1;
    });

    // Create time-based trends (hourly or daily)
    const isHourly = ['15min', '1h', '6h', 'today'].includes(timeRange);
    const groupByFormat = isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';
    
    const trends = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: { $ne: 'cancelled' },
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end },
          discount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalDiscount: { $sum: '$discount' },
          orderCount: { $sum: 1 },
          avgDiscount: { $avg: '$discount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalDiscounts,
      orderCount: orders.length,
      avgDiscountPerOrder: orders.length > 0 ? totalDiscounts / orders.length : 0,
      discountByCoupon: Object.values(discountByCoupon).sort((a, b) => b.amount - a.amount),
      trends: trends.map(t => ({
        date: t._id,
        amount: t.totalDiscount,
        orderCount: t.orderCount,
        avgDiscount: t.avgDiscount
      }))
    };
  } catch (error) {
    console.error('[Analytics] Error getting discount analytics:', error);
    throw error;
  }
};

/**
 * Get complementary amounts analytics
 * Returns total complementary, trends, and breakdown by reason
 */
const getComplementaryAnalytics = async (branchId, timeRange = 'today') => {
  try {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Get orders marked as complementary
    const orders = await Order.find({
      branch: branchObjectId,
      isComplementary: true,
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate total complementary amount
    const totalComplementary = orders.reduce((sum, order) => sum + (order.complementaryAmount || 0), 0);

    // Breakdown by reason
    const complementaryByReason = {};
    orders.forEach(order => {
      const reason = order.complementaryReason || 'Not Specified';
      if (!complementaryByReason[reason]) {
        complementaryByReason[reason] = { reason, amount: 0, count: 0 };
      }
      complementaryByReason[reason].amount += order.complementaryAmount || 0;
      complementaryByReason[reason].count += 1;
    });

    // Time-based trends
    const trends = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          isComplementary: true,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: ['15min', '1h', '6h', 'today'].includes(timeRange) ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalAmount: { $sum: '$complementaryAmount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$complementaryAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalComplementary,
      count: orders.length,
      avgComplementaryAmount: orders.length > 0 ? totalComplementary / orders.length : 0,
      complementaryByReason: Object.values(complementaryByReason).sort((a, b) => b.amount - a.amount),
      trends: trends.map(t => ({
        date: t._id,
        amount: t.totalAmount,
        count: t.count,
        avgAmount: t.avgAmount
      }))
    };
  } catch (error) {
    console.error('[Analytics] Error getting complementary analytics:', error);
    throw error;
  }
};

/**
 * Get cancellation analytics
 * Returns cancelled orders count, trends, and breakdown by reason
 */
const getCancellationAnalytics = async (branchId, timeRange = 'today') => {
  try {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Get cancelled orders
    const orders = await Order.find({
      branch: branchObjectId,
      status: 'cancelled',
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate total cancelled amount and count
    const totalCancelledAmount = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalCancelledOrders = orders.length;

    // Breakdown by reason
    const cancellationByReason = {};
    orders.forEach(order => {
      const reason = order.cancellationReason || 'Not Specified';
      if (!cancellationByReason[reason]) {
        cancellationByReason[reason] = { reason, count: 0, totalAmount: 0 };
      }
      cancellationByReason[reason].count += 1;
      cancellationByReason[reason].totalAmount += order.total || 0;
    });

    // Time-based trends
    const trends = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          status: 'cancelled',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: ['15min', '1h', '6h', 'today'].includes(timeRange) ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          avgAmount: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate cancellation rate
    const totalOrders = await Order.countDocuments({
      branch: branchObjectId,
      createdAt: { $gte: start, $lte: end }
    });

    const cancellationRate = totalOrders > 0 ? (totalCancelledOrders / totalOrders) * 100 : 0;

    return {
      totalCancelledOrders,
      totalCancelledAmount,
      cancellationRate,
      avgCancelledAmount: totalCancelledOrders > 0 ? totalCancelledAmount / totalCancelledOrders : 0,
      cancellationByReason: Object.values(cancellationByReason)
        .sort((a, b) => b.count - a.count)
        .map(item => ({
          ...item,
          percentage: totalCancelledOrders > 0 ? (item.count / totalCancelledOrders) * 100 : 0
        })),
      trends: trends.map(t => ({
        date: t._id,
        count: t.count,
        totalAmount: t.totalAmount,
        avgAmount: t.avgAmount
      }))
    };
  } catch (error) {
    console.error('[Analytics] Error getting cancellation analytics:', error);
    throw error;
  }
};

/**
 * Get customer growth after coupon campaigns
 * Returns customer acquisition/return metrics for coupon-using customers
 */
const getCouponCampaignGrowth = async (branchId, timeRange = '30d') => {
  try {
    const { start, end } = getTimeRange(timeRange);
    const branchObjectId = toObjectId(branchId);

    // Get all orders with coupons
    const couponOrders = await Order.find({
      branch: branchObjectId,
      coupon: { $ne: null },
      createdAt: { $gte: start, $lte: end }
    }).populate('coupon', 'code');

    // Get unique customers who used coupons
    const couponCustomers = new Set(couponOrders.map(o => o.customerPhone).filter(Boolean));

    // Get all orders from coupon users (to check repeat customers)
    const couponUserOrders = await Order.find({
      branch: branchObjectId,
      customerPhone: { $in: Array.from(couponCustomers) },
      createdAt: { $gte: start, $lte: end }
    });

    // Count new vs returning customers with coupons
    const newCustomers = new Set();
    const returningCustomers = new Set();

    for (const phone of couponCustomers) {
      const orderCount = couponUserOrders.filter(o => o.customerPhone === phone).length;
      if (orderCount === 1) {
        newCustomers.add(phone);
      } else {
        returningCustomers.add(phone);
      }
    }

    // Calculate growth trend
    const growthTrend = await Order.aggregate([
      {
        $match: {
          branch: branchObjectId,
          coupon: { $ne: null },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: ['30d', '7d'].includes(timeRange) ? '%Y-%m-%d' : '%Y-%m-%d %H:00',
              date: '$createdAt'
            }
          },
          uniqueCustomers: { $addToSet: '$customerPhone' },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalCouponUsers: couponCustomers.size,
      newCustomers: newCustomers.size,
      returningCustomers: returningCustomers.size,
      returnRate: couponCustomers.size > 0 ? (returningCustomers.size / couponCustomers.size) * 100 : 0,
      totalCouponOrders: couponOrders.length,
      avgOrdersPerCustomer: couponCustomers.size > 0 ? couponOrders.length / couponCustomers.size : 0,
      growthTrend: growthTrend.map(t => ({
        date: t._id,
        uniqueCustomers: t.uniqueCustomers.length,
        orderCount: t.orderCount,
        totalRevenue: t.totalRevenue
      }))
    };
  } catch (error) {
    console.error('[Analytics] Error getting coupon campaign growth:', error);
    throw error;
  }
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
  getMinuteRevenuePattern,
  getDailyRevenuePattern,
  getAIInsights,
  getStatsCache,
  applyStatsDelta,
  getStatsWithCache,
  getDiscountAnalytics,
  getComplementaryAnalytics,
  getCancellationAnalytics,
  getCouponCampaignGrowth
};
