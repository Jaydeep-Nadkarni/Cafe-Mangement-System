import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  ShoppingBag,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  Activity,
  Award,
  Target,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';
import {
  ChartContainer,
  TimeRangeSelector,
  ExportButton,
  VixsHeatmap,
  VixsTreemap,
  VixsBoxPlot,
  VixsScatter
} from '../../../components/charts';
import { formatCurrency } from '../../../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Reports({ branch }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [granularity, setGranularity] = useState('daily'); // daily, weekly, monthly

  // Analytics data states
  const [revenueGrowth, setRevenueGrowth] = useState([]);
  const [seasonalityData, setSeasonalityData] = useState([]);
  const [weekdayPattern, setWeekdayPattern] = useState([]);
  const [hourlyHeatmap, setHourlyHeatmap] = useState([]);
  const [menuLifecycle, setMenuLifecycle] = useState([]);
  const [menuTreemap, setMenuTreemap] = useState([]);
  const [paymentReliability, setPaymentReliability] = useState(null);
  const [orderDistribution, setOrderDistribution] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);

  // Chart refs for export
  const revenueChartRef = useRef(null);
  const seasonalityChartRef = useRef(null);
  const weekdayChartRef = useRef(null);
  const heatmapRef = useRef(null);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    if (!branch?._id) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        revenuePatternRes,
        peakHoursRes,
        tableHeatmapRes,
        menuVelocityRes,
        paymentStatsRes,
        revenueByPaymentRes,
        realtimeRes
      ] = await Promise.all([
        axios.get(`${API_URL}/api/branch/analytics/revenue-pattern?range=${timeRange}&type=${granularity === 'daily' ? 'hourly' : 'daily'}`),
        axios.get(`${API_URL}/api/branch/analytics/peak-hours?range=${timeRange}`),
        axios.get(`${API_URL}/api/branch/analytics/table-heatmap?range=${timeRange}`),
        axios.get(`${API_URL}/api/branch/analytics/item-velocity?range=${timeRange}`),
        axios.get(`${API_URL}/api/branch/analytics/payment-stats?range=${timeRange}`),
        axios.get(`${API_URL}/api/branch/analytics/revenue-by-payment?range=${timeRange}`),
        axios.get(`${API_URL}/api/branch/analytics/realtime?range=${timeRange}`)
      ]);

      // Process revenue growth data
      const revenuePattern = revenuePatternRes.data.pattern || [];
      processRevenueGrowth(revenuePattern);

      // Process seasonality (weekly patterns)
      processSeasonality(revenuePattern);

      // Process weekday patterns
      processWeekdayPattern(revenuePattern);

      // Process hourly heatmap
      const heatmap = tableHeatmapRes.data.heatmap || [];
      setHourlyHeatmap(heatmap);

      // Process menu lifecycle
      const menuItems = menuVelocityRes.data.items || [];
      processMenuLifecycle(menuItems);

      // Process menu treemap
      processMenuTreemap(menuItems);

      // Payment reliability
      setPaymentReliability(paymentStatsRes.data);

      // Order distribution for box plots
      const recentOrders = realtimeRes.data?.recentOrders || [];
      processOrderDistribution(recentOrders);

      // Calculate risk metrics
      calculateRiskMetrics(paymentStatsRes.data, realtimeRes.data);

      // Calculate executive summary
      calculateExecutiveSummary(
        revenuePattern,
        paymentStatsRes.data,
        realtimeRes.data,
        menuItems
      );

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [branch, timeRange, granularity]);

  // Data processing functions
  const processRevenueGrowth = (pattern) => {
    if (!pattern || pattern.length === 0) return;

    const growthData = pattern.map((item, index) => {
      if (index === 0) return { ...item, growth: 0 };
      const prevRevenue = pattern[index - 1].revenue || 0;
      const currentRevenue = item.revenue || 0;
      const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      return { ...item, growth: growth.toFixed(2) };
    });

    setRevenueGrowth(growthData);
  };

  const processSeasonality = (pattern) => {
    // Aggregate by day of week or month
    const seasonalMap = {};

    pattern.forEach(item => {
      const date = new Date(item.label || item.hour);
      const key = granularity === 'monthly'
        ? date.toLocaleString('default', { month: 'short' })
        : date.toLocaleString('default', { weekday: 'short' });

      if (!seasonalMap[key]) {
        seasonalMap[key] = { period: key, revenue: 0, orders: 0, count: 0 };
      }
      seasonalMap[key].revenue += item.revenue || 0;
      seasonalMap[key].orders += item.orders || 0;
      seasonalMap[key].count += 1;
    });

    const seasonalData = Object.values(seasonalMap).map(item => ({
      period: item.period,
      avgRevenue: item.count > 0 ? item.revenue / item.count : 0,
      avgOrders: item.count > 0 ? item.orders / item.count : 0
    }));

    setSeasonalityData(seasonalData);
  };

  const processWeekdayPattern = (pattern) => {
    const weekdayMap = {};
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    pattern.forEach(item => {
      const date = new Date(item.label || item.hour);
      const dayIndex = date.getDay();
      const dayName = weekdays[dayIndex];

      if (!weekdayMap[dayName]) {
        weekdayMap[dayName] = { day: dayName, revenue: 0, orders: 0, count: 0, index: dayIndex };
      }
      weekdayMap[dayName].revenue += item.revenue || 0;
      weekdayMap[dayName].orders += item.orders || 0;
      weekdayMap[dayName].count += 1;
    });

    const weekdayData = Object.values(weekdayMap)
      .sort((a, b) => a.index - b.index)
      .map(item => ({
        day: item.day,
        revenue: item.count > 0 ? item.revenue / item.count : 0,
        orders: item.count > 0 ? item.orders / item.count : 0
      }));

    setWeekdayPattern(weekdayData);
  };

  const processMenuLifecycle = (items) => {
    // Create scatter plot data: velocity vs revenue
    const lifecycleData = items.map(item => ({
      name: item.name,
      velocity: item.velocity || 0,
      revenue: item.revenue || 0,
      orders: item.orders || 0
    }));

    setMenuLifecycle(lifecycleData);
  };

  const processMenuTreemap = (items) => {
    // Create treemap structure
    const treeData = [
      { id: 'root', parent: null, value: 0, name: 'Menu' }
    ];

    items.forEach((item, index) => {
      treeData.push({
        id: `item-${index}`,
        parent: 'root',
        value: item.revenue || 0,
        name: item.name || 'Unknown'
      });
    });

    setMenuTreemap(treeData);
  };

  const processOrderDistribution = (orders) => {
    if (!orders || orders.length === 0) return;

    const ordersByPayment = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!ordersByPayment[method]) ordersByPayment[method] = [];
      ordersByPayment[method].push(order.totalAmount || 0);
    });

    const boxPlotData = Object.entries(ordersByPayment).map(([method, values]) => ({
      category: method,
      values: values
    }));

    setOrderDistribution(boxPlotData);
  };

  const calculateRiskMetrics = (paymentData, realtimeData) => {
    const failureRate = paymentData?.failedCount
      ? (paymentData.failedCount / (paymentData.totalCount || 1)) * 100
      : 0;

    const avgResponseTime = realtimeData?.avgTurnaroundTime || 0;
    const stressLevel = avgResponseTime > 30 ? 'High' : avgResponseTime > 15 ? 'Medium' : 'Low';

    setRiskMetrics({
      failureRate: failureRate.toFixed(2),
      avgResponseTime,
      stressLevel,
      reliabilityScore: (100 - failureRate).toFixed(1)
    });
  };

  const calculateExecutiveSummary = (revenuePattern, paymentData, realtimeData, menuItems) => {
    // Performance Score (0-100): Based on revenue growth
    const totalRevenue = revenuePattern.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const avgRevenue = revenuePattern.length > 0 ? totalRevenue / revenuePattern.length : 0;
    const recentRevenue = revenuePattern.slice(-7).reduce((sum, item) => sum + (item.revenue || 0), 0) / 7;
    const performanceScore = avgRevenue > 0 ? Math.min(100, (recentRevenue / avgRevenue) * 100) : 0;

    // Efficiency Score (0-100): Based on velocity and turnaround
    const avgVelocity = menuItems.length > 0
      ? menuItems.reduce((sum, item) => sum + (item.velocity || 0), 0) / menuItems.length
      : 0;
    const turnaroundScore = realtimeData?.avgTurnaroundTime
      ? Math.max(0, 100 - (realtimeData.avgTurnaroundTime * 2))
      : 50;
    const efficiencyScore = (avgVelocity * 10 + turnaroundScore) / 2;

    // Stability Score (0-100): Based on payment reliability
    const stabilityScore = paymentData?.successRate || 0;

    // Risk Index (0-100): Lower is better
    const failureRate = paymentData?.failedCount
      ? (paymentData.failedCount / (paymentData.totalCount || 1)) * 100
      : 0;
    const riskIndex = failureRate + (realtimeData?.avgTurnaroundTime > 30 ? 30 : 0);

    setExecutiveSummary({
      performanceScore: Math.min(100, performanceScore).toFixed(1),
      efficiencyScore: Math.min(100, efficiencyScore).toFixed(1),
      stabilityScore: stabilityScore.toFixed(1),
      riskIndex: Math.min(100, riskIndex).toFixed(1),
      totalRevenue: totalRevenue,
      totalOrders: revenuePattern.reduce((sum, item) => sum + (item.orders || 0), 0),
      avgOrderValue: realtimeData?.avgOrderValue || 0
    });
  };



  // Listen for payments - INCREMENT revenue
  const handlePayment = (data) => {
    console.log('[Reports] Payment received:', data);
    // Update revenue growth incrementally
    setRevenueGrowth(prev => {
      if (!prev || prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        last.revenue = (last.revenue || 0) + (data.amount || 0);
        last.orders = (last.orders || 0) + 1;
      }
      return updated;
    });
  };

  if (!branch) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading branch data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historical Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive business insights and trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

          {/* Granularity Toggle */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            {['daily', 'weekly', 'monthly'].map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${granularity === g
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Revenue & Growth */}
      <Section title="Revenue & Growth" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Growth Trend */}
          <div ref={revenueChartRef}>
            <ChartCard title="Revenue Growth Trend">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#666" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                      if (name === 'growth') return [`${value}%`, 'Growth'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#616161" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#f97316" strokeWidth={2} name="Growth %" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Seasonality Curve */}
          <div ref={seasonalityChartRef}>
            <ChartCard title="Seasonality Patterns">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seasonalityData}>
                  <defs>
                    <linearGradient id="colorSeasonality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9e9e9e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9e9e9e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value) => [formatCurrency(value), 'Avg Revenue']}
                  />
                  <Area type="monotone" dataKey="avgRevenue" stroke="#757575" fillOpacity={1} fill="url(#colorSeasonality)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </Section>

      {/* Section 2: Day/Date/Time Patterns */}
      <Section title="Day/Date/Time Patterns" icon={<Calendar className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekday Pattern */}
          <div ref={weekdayChartRef}>
            <ChartCard title="Weekday Performance">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekdayPattern}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#666" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value), 'Avg Revenue'];
                      if (name === 'orders') return [value.toFixed(0), 'Avg Orders'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#616161" name="Revenue" />
                  <Bar dataKey="orders" fill="#9e9e9e" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Hourly Heatmap */}
          <div ref={heatmapRef}>
            <ChartContainer
              title="Hour-by-Hour Heatmap"
              subtitle="Activity intensity by hour and day"
              minHeight={300}
            >
              {({ width, height }) => (
                hourlyHeatmap.length > 0 ? (
                  <VixsHeatmap
                    data={hourlyHeatmap}
                    width={width}
                    height={height}
                    xAccessor={d => d.hour}
                    yAccessor={d => d.table || d.day}
                    valueAccessor={d => d.occupancy || d.value}
                    xLabel="Hour"
                    yLabel="Day"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No heatmap data available
                  </div>
                )
              )}
            </ChartContainer>
          </div>
        </div>
      </Section>

      {/* Section 3: Menu Intelligence */}
      <Section title="Menu Intelligence" icon={<ShoppingBag className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Lifecycle (Scatter Plot) */}
          <ChartContainer
            title="Menu Item Lifecycle"
            subtitle="Velocity vs Revenue scatter plot"
            minHeight={350}
          >
            {({ width, height }) => (
              menuLifecycle.length > 0 ? (
                <VixsScatter
                  data={menuLifecycle}
                  width={width}
                  height={height}
                  xAccessor={d => d.velocity}
                  yAccessor={d => d.revenue}
                  sizeAccessor={d => d.orders}
                  xLabel="Velocity (orders/hour)"
                  yLabel="Revenue (₹)"
                  tooltipContent={(d) => (
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-xs text-gray-600">Velocity: {d.velocity.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">Revenue: ₹{d.revenue}</div>
                      <div className="text-xs text-gray-600">Orders: {d.orders}</div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No menu data available
                </div>
              )
            )}
          </ChartContainer>

          {/* Menu Treemap */}
          <ChartContainer
            title="Revenue Distribution by Item"
            subtitle="Treemap showing revenue contribution"
            minHeight={350}
          >
            {({ width, height }) => (
              menuTreemap.length > 1 ? (
                <VixsTreemap
                  data={menuTreemap}
                  width={width}
                  height={height}
                  idAccessor={d => d.id}
                  parentAccessor={d => d.parent}
                  valueAccessor={d => d.value}
                  labelAccessor={d => d.name}
                  tooltipContent={(d) => (
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-gray-600">Revenue: ₹{d.value}</div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No treemap data available
                </div>
              )
            )}
          </ChartContainer>
        </div>
      </Section>

      {/* Section 4: Risk/Reliability/Health */}
      <Section title="Risk, Reliability & Health" icon={<AlertTriangle className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Payment Reliability"
            value={`${riskMetrics?.reliabilityScore || 0}%`}
            icon={<Shield className="w-5 h-5 text-green-600" />}
            status="good"
          />
          <MetricCard
            label="Failure Rate"
            value={`${riskMetrics?.failureRate || 0}%`}
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            status="warning"
          />
          <MetricCard
            label="Avg Response Time"
            value={`${riskMetrics?.avgResponseTime || 0} min`}
            icon={<Clock className="w-5 h-5 text-blue-600" />}
          />
          <MetricCard
            label="Stress Level"
            value={riskMetrics?.stressLevel || 'Low'}
            icon={<Activity className="w-5 h-5 text-yellow-600" />}
            valueClassName={
              riskMetrics?.stressLevel === 'High' ? 'text-red-600' :
                riskMetrics?.stressLevel === 'Medium' ? 'text-yellow-600' :
                  'text-green-600'
            }
          />
        </div>

        {/* Order Value Distribution (Box Plot) */}
        {orderDistribution.length > 0 && (
          <ChartContainer
            title="Order Value Distribution"
            subtitle="Box plot showing order value spread by payment method"
            minHeight={350}
          >
            {({ width, height }) => (
              <VixsBoxPlot
                data={orderDistribution}
                width={width}
                height={height}
                categoryAccessor={d => d.category}
                valuesAccessor={d => d.values}
                xLabel="Payment Method"
                yLabel="Order Value (₹)"
              />
            )}
          </ChartContainer>
        )}
      </Section>

      {/* Section 5: Executive Summary */}
      <Section title="Executive Summary" icon={<FileText className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <ScoreCard
            label="Performance Score"
            score={executiveSummary?.performanceScore || 0}
            icon={<Award className="w-6 h-6 text-purple-600" />}
            description="Revenue growth vs average"
          />
          <ScoreCard
            label="Efficiency Score"
            score={executiveSummary?.efficiencyScore || 0}
            icon={<Zap className="w-6 h-6 text-yellow-600" />}
            description="Velocity & turnaround time"
          />
          <ScoreCard
            label="Stability Score"
            score={executiveSummary?.stabilityScore || 0}
            icon={<Shield className="w-6 h-6 text-green-600" />}
            description="Payment success rate"
          />
          <ScoreCard
            label="Risk Index"
            score={executiveSummary?.riskIndex || 0}
            icon={<Target className="w-6 h-6 text-red-600" />}
            description="Lower is better"
            reverse
          />
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(executiveSummary?.totalRevenue || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{executiveSummary?.totalOrders?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(executiveSummary?.avgOrderValue || 0)}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Export Section */}
      <div className="mt-6 flex flex-wrap justify-end gap-4">
        <ExportButton
          chartRef={revenueChartRef}
          data={revenueGrowth}
          filename="revenue-growth"
          type="both"
        />
        <ExportButton
          chartRef={seasonalityChartRef}
          data={seasonalityData}
          filename="seasonality"
          type="both"
        />
        <ExportButton
          chartRef={weekdayChartRef}
          data={weekdayPattern}
          filename="weekday-pattern"
          type="both"
        />
        <ExportButton
          chartRef={heatmapRef}
          data={hourlyHeatmap}
          filename="hourly-heatmap"
          type="csv"
        />
      </div>
    </div>
  );
}

// Section Component
function Section({ title, icon, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-300">
        <div className="text-orange-600">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg p-4 border border-gray-300 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
      {children}
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, icon, status, valueClassName = '' }) {
  return (
    <div className="rounded-lg p-4 border border-gray-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
          <p className={`text-xl font-bold mt-1 ${valueClassName || 'text-gray-900'}`}>{value}</p>
        </div>
        <div className="ml-2">{icon}</div>
      </div>
    </div>
  );
}

// Score Card Component
function ScoreCard({ label, score, icon, description, reverse = false }) {
  const numericScore = parseFloat(score);
  const getColor = () => {
    if (reverse) {
      // For risk index, lower is better
      if (numericScore >= 70) return 'text-red-600';
      if (numericScore >= 40) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      // For other scores, higher is better
      if (numericScore >= 70) return 'text-green-600';
      if (numericScore >= 40) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const colorClass = getColor();

  return (
    <div className={`rounded-lg p-6 border border-gray-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gray-100`}>
          {icon}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${colorClass}`}>{score}</p>
          <p className="text-xs text-gray-500 mt-1">/ 100</p>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}
