import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  TrendingUp, Users, CreditCard, Clock, DollarSign, ShoppingBag,
  AlertCircle, Activity, RefreshCw, Store, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../../../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CHART_COLORS = ['#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd'];

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg p-4 border border-gray-300 bg-white shadow-sm ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function KPICard({ label, value, trend, icon, realtime, valueClassName = '' }) {
  return (
    <div className="rounded-lg p-4 border border-gray-300 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
            {realtime && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-green-600">LIVE</span>
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${valueClassName || 'text-gray-900'}`}>{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs previous
            </p>
          )}
        </div>
        <div className="ml-2">{icon}</div>
      </div>
    </div>
  );
}

export default function Stats() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [fetchingBranches, setFetchingBranches] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Aggregated stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    activeOrders: 0,
    tableOccupancyRate: 0,
    avgTurnaroundTime: 0,
    availableTables: 0,
    totalTables: 0
  });
  const [revenuePattern, setRevenuePattern] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!fetchingBranches && branches.length === 1 && selectedBranchId === 'all') {
      setSelectedBranchId(branches[0]._id);
    }
  }, [branches, fetchingBranches, selectedBranchId]);

  useEffect(() => {
    if (!fetchingBranches) {
      fetchStats();
    }
  }, [selectedBranchId, timeRange, fetchingBranches]);

  const fetchBranches = async () => {
    try {
      setFetchingBranches(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/admin/branches`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setFetchingBranches(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (selectedBranchId === 'all') {
        // Aggregate stats from all branches
        const branchStatsPromises = branches.map(async (branch) => {
          try {
            const [realtimeRes, revenuePatternRes, paymentRes, peakRes] = await Promise.all([
              axios.get(`${API_URL}/api/branch/analytics/realtime?range=${timeRange}&branchId=${branch._id}`, { headers }).catch(() => ({ data: {} })),
              axios.get(`${API_URL}/api/branch/analytics/revenue-pattern?range=${timeRange}&type=hourly&branchId=${branch._id}`, { headers }).catch(() => ({ data: { pattern: [] } })),
              axios.get(`${API_URL}/api/branch/analytics/revenue-by-payment?range=${timeRange}&branchId=${branch._id}`, { headers }).catch(() => ({ data: { breakdown: [] } })),
              axios.get(`${API_URL}/api/branch/analytics/peak-hours?range=${timeRange}&branchId=${branch._id}`, { headers }).catch(() => ({ data: { hourlyPattern: [] } }))
            ]);
            return {
              branchId: branch._id,
              branchName: branch.name,
              realtime: realtimeRes.data || {},
              revenuePattern: revenuePatternRes.data.pattern || [],
              paymentBreakdown: paymentRes.data.breakdown || [],
              peakHours: peakRes.data.hourlyPattern || []
            };
          } catch (err) {
            console.warn(`Failed to fetch stats for branch ${branch.name}:`, err);
            return null;
          }
        });

        const branchStats = (await Promise.all(branchStatsPromises)).filter(Boolean);

        // Aggregate the data
        const aggregated = {
          totalRevenue: branchStats.reduce((sum, b) => sum + (b.realtime.totalRevenue || 0), 0),
          totalOrders: branchStats.reduce((sum, b) => sum + (b.realtime.totalOrders || 0), 0),
          activeOrders: branchStats.reduce((sum, b) => sum + (b.realtime.activeOrders || 0), 0),
          availableTables: branchStats.reduce((sum, b) => sum + (b.realtime.availableTables || 0), 0),
          totalTables: branchStats.reduce((sum, b) => sum + (b.realtime.totalTables || 0), 0),
        };
        aggregated.avgOrderValue = aggregated.totalOrders > 0 ? aggregated.totalRevenue / aggregated.totalOrders : 0;
        aggregated.tableOccupancyRate = aggregated.totalTables > 0
          ? ((aggregated.totalTables - aggregated.availableTables) / aggregated.totalTables) * 100
          : 0;

        setStats(aggregated);

        // Merge revenue patterns by hour
        const revenueByHour = {};
        branchStats.forEach(b => {
          b.revenuePattern.forEach(item => {
            const key = item.label || item.hour;
            if (!revenueByHour[key]) {
              revenueByHour[key] = { label: key, revenue: 0 };
            }
            revenueByHour[key].revenue += item.revenue || 0;
          });
        });
        setRevenuePattern(Object.values(revenueByHour).sort((a, b) => a.label.localeCompare(b.label)));

        // Merge payment breakdown
        const paymentByMethod = {};
        branchStats.forEach(b => {
          b.paymentBreakdown.forEach(item => {
            const method = item.method || 'Unknown';
            if (!paymentByMethod[method]) {
              paymentByMethod[method] = { method, revenue: 0, count: 0 };
            }
            paymentByMethod[method].revenue += item.revenue || 0;
            paymentByMethod[method].count += item.count || 0;
          });
        });
        setPaymentBreakdown(Object.values(paymentByMethod));

        // Merge peak hours
        const hourlyData = {};
        branchStats.forEach(b => {
          b.peakHours.forEach(item => {
            const hour = item.hour;
            if (!hourlyData[hour]) {
              hourlyData[hour] = { hour, orders: 0, revenue: 0 };
            }
            hourlyData[hour].orders += item.orders || 0;
            hourlyData[hour].revenue += item.revenue || 0;
          });
        });
        setPeakHours(Object.values(hourlyData).sort((a, b) => a.hour - b.hour));

      } else {
        // Fetch stats for specific branch
        const [realtimeRes, revenuePatternRes, paymentRes, peakRes] = await Promise.all([
          axios.get(`${API_URL}/api/branch/analytics/realtime?range=${timeRange}&branchId=${selectedBranchId}`, { headers }).catch(() => ({ data: {} })),
          axios.get(`${API_URL}/api/branch/analytics/revenue-pattern?range=${timeRange}&type=hourly&branchId=${selectedBranchId}`, { headers }).catch(() => ({ data: { pattern: [] } })),
          axios.get(`${API_URL}/api/branch/analytics/revenue-by-payment?range=${timeRange}&branchId=${selectedBranchId}`, { headers }).catch(() => ({ data: { breakdown: [] } })),
          axios.get(`${API_URL}/api/branch/analytics/peak-hours?range=${timeRange}&branchId=${selectedBranchId}`, { headers }).catch(() => ({ data: { hourlyPattern: [] } }))
        ]);

        setStats(realtimeRes.data || {});
        setRevenuePattern(revenuePatternRes.data.pattern || []);
        setPaymentBreakdown(paymentRes.data.breakdown || []);
        setPeakHours(peakRes.data.hourlyPattern || []);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (fetchingBranches || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Statistics</h1>
        <p className="text-gray-500 mt-1">Comprehensive insights across all branches</p>
      </div>

      {/* Branch Selection */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Branch Filter</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedBranchId('all')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 border ${selectedBranchId === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
          >
            <BarChart3 size={18} className={selectedBranchId === 'all' ? 'text-blue-100' : 'text-gray-400'} />
            <span className="font-medium">All Branches</span>
            {selectedBranchId === 'all' && <span className="ml-1 text-xs bg-blue-500 px-2 py-0.5 rounded-full">{branches.length}</span>}
          </button>
          {branches.map((branch) => (
            <button
              key={branch._id}
              onClick={() => setSelectedBranchId(branch._id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 border ${selectedBranchId === branch._id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
            >
              <Store size={18} className={selectedBranchId === branch._id ? 'text-blue-100' : 'text-gray-400'} />
              <span className="font-medium">{branch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue || 0)}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        />
        <KPICard
          label="Total Orders"
          value={stats.totalOrders || 0}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        />
        <KPICard
          label="Avg Order Value"
          value={formatCurrency(stats.avgOrderValue || 0)}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        />
        <KPICard
          label="Active Orders"
          value={stats.activeOrders || 0}
          icon={<Activity className="w-5 h-5 text-orange-600" />}
          realtime
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Pattern */}
        <ChartCard title="Revenue Pattern">
          {revenuePattern.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenuePattern}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#757575" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#757575" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#666" />
                <YAxis tick={{ fontSize: 11 }} stroke="#666" />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#424242" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No revenue data</div>
          )}
        </ChartCard>

        {/* Payment Breakdown */}
        <ChartCard title="Revenue by Payment Method">
          {paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.method}: ${formatCurrency(entry.revenue)}`}
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No payment data</div>
          )}
        </ChartCard>
      </div>

      {/* Peak Hours */}
      <ChartCard title="Peak Hours Analysis">
        {peakHours.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#666" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#666" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#666" />
              <Tooltip formatter={(value, name) => name === 'Orders' ? [value, 'Orders'] : [formatCurrency(value), 'Revenue']} />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" fill="#616161" name="Orders" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" fill="#9e9e9e" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">No peak hours data</div>
        )}
      </ChartCard>

      {/* Table Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <KPICard
          label="Table Occupancy"
          value={`${stats.tableOccupancyRate?.toFixed(1) || 0}%`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          realtime
        />
        <KPICard
          label="Available Tables"
          value={`${stats.availableTables || 0}/${stats.totalTables || 0}`}
          icon={<Activity className="w-5 h-5 text-green-600" />}
          realtime
        />
        <KPICard
          label="Avg Turnaround"
          value={`${stats.avgTurnaroundTime || 0} min`}
          icon={<Clock className="w-5 h-5 text-purple-600" />}
        />
      </div>
    </div>
  );
}
