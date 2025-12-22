import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ChartContainer,
  TimeRangeSelector,
  ExportButton,
  VixsHeatmap,
  VixsTreemap,
  VixsBoxPlot,
  VixsScatter,
  VixsHistogram
} from '../../../components/charts';
import { formatCurrency } from '../../../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Simple Card Wrapper Component for Charts
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg p-4 border border-gray-300 bg-white shadow-sm ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// Neutral colors for charts
const CHART_COLORS = ['#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd'];

export default function Stats({ branch }) {
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Real-time stats
  const [realtimeStats, setRealtimeStats] = useState(null);

  // Analytics data
  const [revenueData, setRevenueData] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [tableHeatmap, setTableHeatmap] = useState([]);
  const [menuVelocity, setMenuVelocity] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [revenuePattern, setRevenuePattern] = useState([]);
  const [orderDistribution, setOrderDistribution] = useState([]);

  // Chart refs for export
  const revenueChartRef = useRef(null);
  const heatmapRef = useRef(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      console.log('[Stats] Fetching analytics with timeRange:', timeRange);

      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Define all API calls with try-catch individually for resilience
      let realtimeRes = null;
      let revenueByPaymentRes = null;
      let tableHeatmapRes = null;
      let velocityRes = null;
      let paymentStatsRes = null;
      let peakHoursRes = null;
      let revenuePatternRes = null;

      try {
        realtimeRes = await axios.get(`${API_URL}/api/branch/analytics/realtime?range=${timeRange}`, { headers });
        console.log('[Stats] Realtime Stats:', realtimeRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch realtime stats:', err.message);
        realtimeRes = { data: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, activeOrders: 0, tableOccupancyRate: 0, avgTurnaroundTime: 0, availableTables: 0, totalTables: 0 } };
      }

      try {
        revenueByPaymentRes = await axios.get(`${API_URL}/api/branch/analytics/revenue-by-payment?range=${timeRange}`, { headers });
      } catch (err) {
        console.warn('[Stats] Failed to fetch revenue by payment:', err.message);
        revenueByPaymentRes = { data: { breakdown: [] } };
      }

      try {
        tableHeatmapRes = await axios.get(`${API_URL}/api/branch/analytics/table-heatmap?range=${timeRange}`, { headers });
      } catch (err) {
        console.warn('[Stats] Failed to fetch table heatmap:', err.message);
        tableHeatmapRes = { data: { heatmap: [] } };
      }

      try {
        velocityRes = await axios.get(`${API_URL}/api/branch/analytics/item-velocity?range=${timeRange}`, { headers });
      } catch (err) {
        console.warn('[Stats] Failed to fetch menu velocity:', err.message);
        velocityRes = { data: { items: [] } };
      }

      try {
        paymentStatsRes = await axios.get(`${API_URL}/api/branch/analytics/payment-stats?range=${timeRange}`, { headers });
      } catch (err) {
        console.warn('[Stats] Failed to fetch payment stats:', err.message);
        paymentStatsRes = { data: { successRate: 0, failedCount: 0, pendingCount: 0 } };
      }

      try {
        peakHoursRes = await axios.get(`${API_URL}/api/branch/analytics/peak-hours?range=${timeRange}`, { headers });
        console.log('[Stats] Peak Hours Response:', peakHoursRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch peak hours:', err.message);
        peakHoursRes = { data: { hourlyPattern: [] } };
      }

      try {
        revenuePatternRes = await axios.get(`${API_URL}/api/branch/analytics/revenue-pattern?range=${timeRange}&type=hourly`, { headers });
        console.log('[Stats] Revenue Pattern Response:', revenuePatternRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch revenue pattern:', err.message);
        revenuePatternRes = { data: { pattern: [] } };
      }

      // Update state with whatever data we have
      setRealtimeStats(realtimeRes.data);
      setPaymentBreakdown(revenueByPaymentRes.data.breakdown || []);
      setTableHeatmap(tableHeatmapRes.data.heatmap || []);
      setMenuVelocity(velocityRes.data.items || []);
      setPaymentStats(paymentStatsRes.data || {});

      const hourlyData = peakHoursRes.data.hourlyPattern || [];
      setPeakHours(hourlyData);

      const patternData = revenuePatternRes.data.pattern || [];
      setRevenuePattern(patternData);

      // Generate order distribution for box plot
      const orders = realtimeRes.data?.recentOrders || [];
      if (orders.length > 0) {
        const ordersByPayment = {};
        orders.forEach(order => {
          const method = order.paymentMethod || 'Unknown';
          if (!ordersByPayment[method]) ordersByPayment[method] = [];
          ordersByPayment[method].push(order.totalAmount);
        });

        const boxPlotData = Object.entries(ordersByPayment).map(([method, values]) => ({
          category: method,
          values: values
        }));
        setOrderDistribution(boxPlotData);
      }

      setLoading(false);
      setRefreshing(false);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching analytics:', error);
      const errorMessage = error.response?.status === 401
        ? 'Authentication failed. Please log in again.'
        : error.response?.data?.message || 'Failed to load some analytics data. Showing available data.';
      setError(null); // Don't show error if we have partial data
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
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

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchAnalytics();
            }}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
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

  // KPI Card Component
  function KPICard({ label, value, trend, icon, realtime, valueClassName = '' }) {
    return (
      <div className="rounded-lg p-4 border border-gray-300">
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
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs previous period
              </p>
            )}
          </div>
          <div className="ml-2">{icon}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header with Time Range Selector */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Section 1: Revenue & Sales */}
      <Section title="Revenue & Sales" icon={<DollarSign className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <KPICard
              label="Total Revenue"
              value={formatCurrency(realtimeStats?.totalRevenue || 0)}
              trend={realtimeStats?.revenueTrend}
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            />
            <KPICard
              label="Orders"
              value={realtimeStats?.totalOrders || 0}
              trend={realtimeStats?.ordersTrend}
              icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
            />
            <KPICard
              label="Avg Order Value"
              value={formatCurrency(realtimeStats?.avgOrderValue || 0)}
              icon={<DollarSign className="w-5 h-5 text-purple-600" />}
            />
            <KPICard
              label="Active Orders"
              value={realtimeStats?.activeOrders || 0}
              icon={<Activity className="w-5 h-5 text-orange-600" />}
              realtime
            />
          </div>

          {/* Revenue Pattern Chart */}
          <div ref={revenueChartRef}>
            <ChartCard title="Revenue Pattern">
              {revenuePattern && revenuePattern.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenuePattern}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#757575" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#757575" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      stroke="#666"
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#666"
                      domain={[0, (dataMax) => Math.max(dataMax, 100)]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      animationDuration={200}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#424242"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  No revenue data for this period
                </div>
              )}
            </ChartCard>
          </div>
        </div>

        {/* Peak Hours Chart */}
        <ChartCard title="Peak Hours Analysis" className="mt-6">
          {peakHours && peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                  label={{ value: 'Orders', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                  label={{ value: 'Revenue (₹)', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Orders') return [value, 'Orders'];
                    return [formatCurrency(value), 'Revenue'];
                  }}
                  labelFormatter={(label) => `Hour: ${label}`}
                  animationDuration={200}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  fill="#616161"
                  name="Orders"
                  radius={[4, 4, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
                <Bar
                  yAxisId="right"
                  dataKey="revenue"
                  fill="#9e9e9e"
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No peak hours data available
            </div>
          )}
        </ChartCard>
      </Section>

      {/* Section 2: Table & Seating Intelligence */}
      <Section title="Table & Seating Intelligence" icon={<Users className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <KPICard
            label="Table Occupancy"
            value={`${realtimeStats?.tableOccupancyRate?.toFixed(1) || 0}%`}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            realtime
          />
          <KPICard
            label="Avg Turnaround"
            value={`${realtimeStats?.avgTurnaroundTime || 0} min`}
            icon={<Clock className="w-5 h-5 text-purple-600" />}
          />
          <KPICard
            label="Tables Available"
            value={`${realtimeStats?.availableTables || 0}/${realtimeStats?.totalTables || 0}`}
            icon={<Activity className="w-5 h-5 text-green-600" />}
            realtime
          />
        </div>

        {/* Table Occupancy Heatmap */}
        <div ref={heatmapRef}>
          <ChartContainer
            title="Table Occupancy Heatmap"
            subtitle="Shows occupancy patterns by table and time"
            minHeight={350}
          >
            {({ width, height }) => (
              tableHeatmap.length > 0 ? (
                <VixsHeatmap
                  data={tableHeatmap}
                  width={width}
                  height={height}
                  xAccessor={d => d.hour}
                  yAccessor={d => d.table}
                  valueAccessor={d => d.occupancy}
                  xLabel="Hour of Day"
                  yLabel="Table"
                  tooltipContent={(d) => (
                    <div>
                      <div className="font-semibold">{d.bin}</div>
                      <div className="text-gray-600">Occupancy: {d.count}%</div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No occupancy data available
                </div>
              )
            )}
          </ChartContainer>
        </div>
      </Section>

      {/* Section 3: Menu Performance */}
      <Section title="Menu Performance" icon={<ShoppingBag className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Velocity Chart */}
          <ChartCard title="Item Velocity (orders/hour)">
            {menuVelocity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={menuVelocity.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#666" domain={[0, 'auto']} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value) => [value.toFixed(2), 'Velocity']}
                  />
                  <Bar dataKey="velocity" fill="#757575" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No menu item data for this period
              </div>
            )}
          </ChartCard>

          {/* Top Items by Revenue */}
          <ChartCard title="Revenue by Item (Top 10)">
            {menuVelocity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={menuVelocity.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, angle: -45 }} height={80} stroke="#666" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#666" domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#616161" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No revenue data for this period
              </div>
            )}
          </ChartCard>
        </div>
      </Section>

      {/* Section 4: Payments */}
      <Section title="Payment Analytics" icon={<CreditCard className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment KPIs */}
          <div className="space-y-4">
            <KPICard
              label="Success Rate"
              value={`${paymentStats?.successRate?.toFixed(1) || 0}%`}
              icon={<CreditCard className="w-5 h-5 text-green-600" />}
            />
            <KPICard
              label="Failed Payments"
              value={paymentStats?.failedCount || 0}
              icon={<AlertCircle className="w-5 h-5 text-red-600" />}
            />
            <KPICard
              label="Pending"
              value={paymentStats?.pendingCount || 0}
              icon={<Clock className="w-5 h-5 text-yellow-600" />}
              realtime
            />
          </div>

          {/* Payment Method Breakdown */}
          <ChartCard title="Revenue by Payment Method" className="lg:col-span-2">
            {paymentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="revenue"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.method}: ₹${entry.revenue}`}
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                No payment data for this period
              </div>
            )}
          </ChartCard>
        </div>

        {/* Order Value Distribution */}
        {orderDistribution.length > 0 && (
          <ChartContainer
            title="Order Value Distribution by Payment Method"
            subtitle="Box plot showing min, Q1, median, Q3, and max order values"
            minHeight={350}
            className="mt-6"
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

      {/* Section 5: Peak/Stress/Ops Health */}
      <Section title="Operations Health" icon={<Activity className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="System Status"
            value="Healthy"
            icon={<Activity className="w-5 h-5 text-green-600" />}
            valueClassName="text-green-600"
            realtime
          />
          <KPICard
            label="Peak Hour"
            value={peakHours.find(h => h.isPeak)?.hour || 'N/A'}
            icon={<Clock className="w-5 h-5 text-orange-600" />}
          />
          <KPICard
            label="Stress Level"
            value={realtimeStats?.stressLevel || 'Low'}
            icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
            valueClassName={
              realtimeStats?.stressLevel === 'High' ? 'text-red-600' :
                realtimeStats?.stressLevel === 'Medium' ? 'text-yellow-600' :
                  'text-green-600'
            }
          />
          <KPICard
            label="Active Staff"
            value={realtimeStats?.activeStaff || 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            realtime
          />
        </div>

        {/* Peak Hours Indicator */}
        <ChartCard title="Hourly Activity Intensity">
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#666" />
                <YAxis tick={{ fontSize: 11 }} stroke="#666" domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#616161"
                  strokeWidth={2}
                  dot={{ fill: '#616161', r: 4 }}
                  name="Order Count"
                />
                <Line
                  type="monotone"
                  dataKey="avgWaitTime"
                  stroke="#9e9e9e"
                  strokeWidth={2}
                  dot={{ fill: '#9e9e9e', r: 4 }}
                  name="Avg Wait (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No activity data for this period
            </div>
          )}
        </ChartCard>
      </Section>

      {/* Export Section */}
      <div className="mt-6 flex justify-end gap-4">
        <div>
          <ExportButton
            chartRef={revenueChartRef}
            data={revenuePattern}
            filename="revenue-pattern"
            type="both"
          />
        </div>
        <div>
          <ExportButton
            chartRef={heatmapRef}
            data={tableHeatmap}
            filename="table-heatmap"
            type="csv"
          />
        </div>
      </div>
    </div>
  );
}