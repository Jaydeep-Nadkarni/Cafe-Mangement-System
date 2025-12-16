import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Calendar, DollarSign, ShoppingBag, Users, TrendingUp, Clock, Download, 
  ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCustomDate, setShowCustomDate] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customDates]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let start = new Date();
      let end = new Date();

      if (dateRange === 'custom') {
        if (!customDates.start || !customDates.end) return;
        start = new Date(customDates.start);
        end = new Date(customDates.end);
      } else {
        start.setDate(start.getDate() - parseInt(dateRange));
      }

      const response = await axios.get(`${API_URL}/api/branch/analytics`, {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;
    
    const csvContent = [
      ['Date', 'Revenue', 'Orders'],
      ...data.revenueTrend.map(item => [item._id, item.revenue, item.orders])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-500">Track your business performance and growth</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
            {['7', '30', '90'].map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setShowCustomDate(false); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range && !showCustomDate
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Last {range} Days
              </button>
            ))}
            <button
              onClick={() => { setDateRange('custom'); setShowCustomDate(true); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                showCustomDate ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Custom
            </button>
          </div>

          {showCustomDate && (
            <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <input 
                type="date" 
                className="text-sm outline-none"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                className="text-sm outline-none"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          )}

          <button 
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data?.summary.totalRevenue || 0)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +8.2%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data?.summary.totalOrders || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              <Users className="w-3 h-3 mr-1" /> {data?.customerStats.returningCustomers || 0} Return
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data?.customerStats.totalUniqueCustomers || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Avg Order Value</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data?.summary.avgOrderValue || 0)}</p>
        </div>
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {data?.categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Peak Hours Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.peakHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Items</h3>
          <div className="space-y-4 overflow-y-auto max-h-64 pr-2">
            {data?.topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{item.quantity} sold</p>
                  <p className="text-xs text-green-600 font-medium">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
