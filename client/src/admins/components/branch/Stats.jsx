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
  RefreshCw,
  Download,
  Percent,
  Trash2,
  Gift
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ChartContainer,
  TimeRangeSelector,
  ExportButton,
  VixsBoxPlot,
  VixsScatter,
  VixsHistogram
} from '../../../components/charts';
import { formatCurrency } from '../../../utils/formatCurrency';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

// Vibrant colors for individual items
const ITEM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

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

export default function Stats({ branch }) {
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemSearchFilter, setItemSearchFilter] = useState('');
  const [expandedChart, setExpandedChart] = useState(null);

  // Real-time stats
  const [realtimeStats, setRealtimeStats] = useState(null);

  // Analytics data
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [tableHeatmap, setTableHeatmap] = useState([]);
  const [menuVelocity, setMenuVelocity] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [revenuePattern, setRevenuePattern] = useState([]);
  const [orderDistribution, setOrderDistribution] = useState([]);
  
  // New analytics data for discounts, complementary, and cancellations
  const [discountData, setDiscountData] = useState(null);
  const [complementaryData, setComplementaryData] = useState(null);
  const [cancellationData, setCancellationData] = useState(null);
  const [couponGrowthData, setCouponGrowthData] = useState(null);

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
        console.log('[Stats] Table Heatmap Response:', tableHeatmapRes.data);
        console.log('[Stats] Table Heatmap Response Type:', typeof tableHeatmapRes.data);
        console.log('[Stats] Is Array?:', Array.isArray(tableHeatmapRes.data));
      } catch (err) {
        console.warn('[Stats] Failed to fetch table heatmap:', err.message);
        console.error('[Stats] Table Heatmap Error Details:', err.response?.data || err);
        tableHeatmapRes = { data: [] };
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
        const patternType = (timeRange === 'today' || timeRange === '1h' || timeRange === '6h' || timeRange === '15min') ? 'hourly' : 'daily';
        revenuePatternRes = await axios.get(`${API_URL}/api/branch/analytics/revenue-pattern?range=${timeRange}&type=${patternType}`, { headers });
        console.log('[Stats] Revenue Pattern Response:', revenuePatternRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch revenue pattern:', err.message);
        revenuePatternRes = { data: { pattern: [] } };
      }

      // Fetch new analytics data
      let discountRes = null;
      let complementaryRes = null;
      let cancellationRes = null;
      let couponGrowthRes = null;

      try {
        discountRes = await axios.get(`${API_URL}/api/branch/analytics/discounts?range=${timeRange}`, { headers });
        console.log('[Stats] Discount Analytics:', discountRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch discount analytics:', err.message);
        discountRes = { data: { totalDiscounts: 0, orderCount: 0, avgDiscountPerOrder: 0, discountByCoupon: [], trends: [] } };
      }

      try {
        complementaryRes = await axios.get(`${API_URL}/api/branch/analytics/complementary?range=${timeRange}`, { headers });
        console.log('[Stats] Complementary Analytics:', complementaryRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch complementary analytics:', err.message);
        complementaryRes = { data: { totalComplementary: 0, count: 0, avgComplementaryAmount: 0, complementaryByReason: [], trends: [] } };
      }

      try {
        cancellationRes = await axios.get(`${API_URL}/api/branch/analytics/cancellations?range=${timeRange}`, { headers });
        console.log('[Stats] Cancellation Analytics:', cancellationRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch cancellation analytics:', err.message);
        cancellationRes = { data: { totalCancelledOrders: 0, totalCancelledAmount: 0, cancellationRate: 0, cancellationByReason: [], trends: [] } };
      }

      try {
        const couponRange = timeRange === 'today' || timeRange === '1h' || timeRange === '6h' || timeRange === '15min' ? '7d' : timeRange;
        couponGrowthRes = await axios.get(`${API_URL}/api/branch/analytics/coupon-growth?range=${couponRange}`, { headers });
        console.log('[Stats] Coupon Growth Analytics:', couponGrowthRes.data);
      } catch (err) {
        console.warn('[Stats] Failed to fetch coupon growth analytics:', err.message);
        couponGrowthRes = { data: { totalCouponUsers: 0, newCustomers: 0, returningCustomers: 0, returnRate: 0, growthTrend: [] } };
      }

      // Update state with whatever data we have
      setRealtimeStats(realtimeRes.data);
      setPaymentBreakdown(revenueByPaymentRes.data.breakdown || []);
      
      // Handle both array and object response formats for heatmap
      let heatmapData = [];
      if (Array.isArray(tableHeatmapRes.data)) {
        heatmapData = tableHeatmapRes.data;
      } else if (tableHeatmapRes.data?.heatmap) {
        heatmapData = tableHeatmapRes.data.heatmap;
      }
      console.log('[Stats] Final heatmap data to set:', heatmapData);
      setTableHeatmap(heatmapData);
      
      setMenuVelocity(velocityRes.data.items || []);
      setPaymentStats(paymentStatsRes.data || {});

      const hourlyData = peakHoursRes.data.hourlyPattern || [];
      setPeakHours(hourlyData);

      const patternData = revenuePatternRes.data.pattern || [];
      
      // Format labels based on timeRange
      const formattedPattern = patternData.map(item => {
        if (timeRange === '7d' || timeRange === '30d') {
          // Backend returns { date: 'YYYY-MM-DD', ... }
          if (item.date) {
            const date = new Date(item.date);
            return {
              ...item,
              label: date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })
            };
          }
        }
        // For hourly, backend already returns label: 'HH:00'
        return item;
      });

      setRevenuePattern(formattedPattern);

      // Set new analytics data
      setDiscountData(discountRes.data);
      setComplementaryData(complementaryRes.data);
      setCancellationData(cancellationRes.data);
      setCouponGrowthData(couponGrowthRes.data);

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

  // Export to PDF
  const exportToPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;
      const margin = 12;

      // Title
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('STATISTICS & ANALYTICS REPORT', margin, yPosition);

      // Header Info
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Time Range: ${timeRange.toUpperCase()}`, margin, yPosition);
      yPosition += 10;

      // Section 1: Revenue & Sales
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('REVENUE & SALES', margin, yPosition);
      yPosition += 7;

      const revenueData = [
        ['Total Revenue', formatCurrency(realtimeStats?.totalRevenue || 0)],
        ['Total Orders', realtimeStats?.totalOrders || 0],
        ['Avg Order Value', formatCurrency(realtimeStats?.avgOrderValue || 0)],
        ['Revenue Trend', `${realtimeStats?.revenueTrend || 0}%`]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: revenueData,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 0 },
        alternateRowStyles: { fillColor: [242, 242, 242] }
      });
      yPosition = pdf.lastAutoTable.finalY + 8;

      // Section 2: Operational Metrics
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('OPERATIONAL METRICS', margin, yPosition);
      yPosition += 7;

      const operationalData = [
        ['Active Orders', realtimeStats?.activeOrders || 0],
        ['Table Occupancy Rate', `${(realtimeStats?.tableOccupancyRate || 0).toFixed(1)}%`],
        ['Avg Turnaround Time', `${realtimeStats?.avgTurnaroundTime || 0} min`],
        ['Available Tables', `${realtimeStats?.availableTables || 0}/${realtimeStats?.totalTables || 0}`]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: operationalData,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 0 },
        alternateRowStyles: { fillColor: [242, 242, 242] }
      });
      yPosition = pdf.lastAutoTable.finalY + 8;

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 15;
      }

      // Section 3: Payment Metrics
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text('PAYMENT METRICS', margin, yPosition);
      yPosition += 7;

      const paymentData = [
        ['Success Rate', `${paymentStats?.successRate?.toFixed(1) || 0}%`],
        ['Failed Payments', paymentStats?.failedCount || 0],
        ['Pending Payments', paymentStats?.pendingCount || 0]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: paymentData,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 0 },
        alternateRowStyles: { fillColor: [242, 242, 242] }
      });
      yPosition = pdf.lastAutoTable.finalY + 8;

      // Section 4: Payment Breakdown
      if (paymentBreakdown.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(51, 51, 51);
        pdf.text('PAYMENT METHOD BREAKDOWN', margin, yPosition);
        yPosition += 7;

        const paymentBreakdownData = paymentBreakdown.map(item => [
          item.method || 'Unknown',
          formatCurrency(item.revenue || 0),
          item.count || 0
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Payment Method', 'Revenue', 'Count']],
          body: paymentBreakdownData,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
          bodyStyles: { textColor: 0 },
          alternateRowStyles: { fillColor: [242, 242, 242] }
        });
        yPosition = pdf.lastAutoTable.finalY + 8;
      }

      // Section 5: Menu Velocity
      if (menuVelocity.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(51, 51, 51);
        pdf.text('TOP SELLING ITEMS', margin, yPosition);
        yPosition += 7;

        const velocityData = menuVelocity.slice(0, 10).map(item => [
          item.name || '',
          item.category || '',
          item.totalSold || 0,
          formatCurrency(item.revenue || 0)
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Item Name', 'Category', 'Qty Sold', 'Revenue']],
          body: velocityData,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
          bodyStyles: { textColor: 0 },
          alternateRowStyles: { fillColor: [242, 242, 242] }
        });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`Stats-Report-${dateStr}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try exporting as Excel instead.');
    }
  };

  // Export to XLS
  const exportToXLS = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['STATISTICS & ANALYTICS REPORT'],
        ['Generated:', new Date().toLocaleString('en-IN')],
        ['Time Range:', timeRange],
        [],
        ['REVENUE & SALES'],
        ['Total Revenue', formatCurrency(realtimeStats?.totalRevenue || 0)],
        ['Total Orders', realtimeStats?.totalOrders || 0],
        ['Avg Order Value', formatCurrency(realtimeStats?.avgOrderValue || 0)],
        ['Revenue Trend', `${realtimeStats?.revenueTrend || 0}%`],
        [],
        ['OPERATIONAL METRICS'],
        ['Active Orders', realtimeStats?.activeOrders || 0],
        ['Table Occupancy Rate', `${(realtimeStats?.tableOccupancyRate || 0).toFixed(1)}%`],
        ['Avg Turnaround Time', `${realtimeStats?.avgTurnaroundTime || 0} min`],
        ['Available Tables', `${realtimeStats?.availableTables || 0}/${realtimeStats?.totalTables || 0}`],
        [],
        ['PAYMENT METRICS'],
        ['Success Rate', `${paymentStats?.successRate?.toFixed(1) || 0}%`],
        ['Failed Payments', paymentStats?.failedCount || 0],
        ['Pending Payments', paymentStats?.pendingCount || 0]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Payment Breakdown
      if (paymentBreakdown.length > 0) {
        const paymentData = [
          ['Payment Method', 'Revenue', 'Count']
        ];
        paymentBreakdown.forEach(item => {
          paymentData.push([
            item.method || 'Unknown',
            item.revenue || 0,
            item.count || 0
          ]);
        });
        const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
        paymentSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Methods');
      }

      // Sheet 3: Revenue Pattern
      if (revenuePattern.length > 0) {
        const revenueData = [
          ['Time/Date', 'Revenue', 'Orders']
        ];
        revenuePattern.forEach(item => {
          revenueData.push([
            item.label || item.date || item.hour || '',
            item.revenue || 0,
            item.orders || 0
          ]);
        });
        const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
        revenueSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Pattern');
      }

      // Sheet 4: Peak Hours
      if (peakHours.length > 0) {
        const peakData = [
          ['Hour', 'Orders', 'Revenue']
        ];
        peakHours.forEach(item => {
          peakData.push([
            item.hour || item.label || '',
            item.orders || 0,
            item.revenue || 0
          ]);
        });
        const peakSheet = XLSX.utils.aoa_to_sheet(peakData);
        peakSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, peakSheet, 'Peak Hours');
      }

      // Sheet 5: Menu Velocity (Top Selling Items)
      if (menuVelocity.length > 0) {
        const velocityData = [
          ['Item Name', 'Category', 'Quantity Sold', 'Revenue']
        ];
        menuVelocity.forEach(item => {
          velocityData.push([
            item.name || '',
            item.category || '',
            item.totalSold || 0,
            item.revenue || 0
          ]);
        });
        const velocitySheet = XLSX.utils.aoa_to_sheet(velocityData);
        velocitySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, velocitySheet, 'Menu Velocity');
      }

      // Sheet 6: Table Heatmap
      if (sortedTableHeatmap.length > 0) {
        const tableData = [
          ['Table Number', 'Total Orders', 'Revenue', 'Occupancy %']
        ];
        sortedTableHeatmap.forEach(item => {
          tableData.push([
            item.tableNumber || '',
            item.totalOrders || 0,
            item.revenue || 0,
            item.occupancyPercentage || item.occupancyPercent || 0
          ]);
        });
        const tableSheet = XLSX.utils.aoa_to_sheet(tableData);
        tableSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, tableSheet, 'Table Heatmap');
      }

      // Save workbook
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Stats-Report-${dateStr}.xlsx`);
    } catch (error) {
      console.error('XLS export error:', error);
      alert('Failed to export Excel file');
    }
  };

  const sortedTableHeatmap = React.useMemo(() => {
    if (!Array.isArray(tableHeatmap)) return [];
    return [...tableHeatmap].sort((a, b) => {
      const numA = parseInt(String(a.tableNumber).replace(/\D/g, '')) || 0;
      const numB = parseInt(String(b.tableNumber).replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [tableHeatmap]);

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
            className="p-2 rounded-lg text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Export Buttons */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-700 transition-colors text-sm font-medium"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToXLS}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-green-700 transition-colors text-sm font-medium"
              title="Export as Excel"
            >
              <Download className="w-4 h-4" />
              XLS
            </button>
          </div>
          
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
                  <LineChart data={revenuePattern}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      stroke="#666"
                      interval={timeRange === 'today' ? 2 : 'preserveStartEnd'}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#666"
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#424242"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#424242', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
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
            value={`${realtimeStats?.tableOccupancyRate ? realtimeStats.tableOccupancyRate.toFixed(1) : 0}%`}
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

        {/* Table Revenue Heatmap */}
        <div ref={heatmapRef}>
          <ChartCard title="Revenue by Table">
            {sortedTableHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={sortedTableHeatmap}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="tableNumber" 
                    tick={{ fontSize: 11 }} 
                    stroke="#666"
                    label={{ value: 'Table Number', position: 'insideBottomRight', offset: -10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    stroke="#666"
                    label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`₹${value.toFixed(2)}`, 'Revenue'];
                      if (name === 'orders') return [value, 'Orders'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Table ${label}`}
                    animationDuration={200}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#616161"
                    name="Revenue (₹)"
                    radius={[4, 4, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-gray-500 space-y-2">
                <Activity className="w-8 h-8 text-gray-300" />
                <p>No table revenue data available</p>
                <p className="text-xs text-gray-400">Revenue by table will appear here</p>
              </div>
            )}
          </ChartCard>

          {/* Table Performance Summary */}
          {sortedTableHeatmap.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Performance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sortedTableHeatmap.map((table, idx) => {
                  const totalRevenue = sortedTableHeatmap.reduce((sum, t) => sum + (t.revenue || 0), 0);
                  const revenueShare = totalRevenue > 0 ? ((table.revenue / totalRevenue) * 100) : 0;
                  
                  return (
                    <div 
                      key={table._id || idx} 
                      className="rounded-lg p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-lg">Table {table.tableNumber}</span>    
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ₹{(table.revenue || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 border-t pt-2">
                        <div className="flex justify-between">
                          <span>Orders:</span>
                          <span className="font-semibold">{table.orders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Value:</span>
                          <span className="font-semibold">₹{(table.avgOrderValue || 0).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <span className="font-semibold">{table.capacity || 'N/A'}</span>
                        </div>
                        {/* Utilization removed as requested */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

     {/* Section 3: Menu Performance */}
      <Section title="Menu Performance" icon={<ShoppingBag className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Item Selection & Performance */}
          <ChartCard title="Item Performance Analysis">
            {menuVelocity.length > 0 ? (
              <div className="space-y-4">
                {/* Search Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
                  <input
                    type="text"
                    placeholder="Search by item name..."
                    value={itemSearchFilter}
                    onChange={(e) => {
                      setItemSearchFilter(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Item Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
                  <select
                    value={selectedItem ? menuVelocity.findIndex(i => (i._id || i.name) === (selectedItem._id || selectedItem.name)) : ''}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx)) setSelectedItem(menuVelocity[idx]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Select an item --</option>
                    {menuVelocity
                      .filter(item => item.name?.toLowerCase().includes(itemSearchFilter.toLowerCase()))
                      .map((item) => (
                        <option key={item._id || item.name} value={menuVelocity.indexOf(item)}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selected Item Performance Stats */}
                {selectedItem && (
                  <div className="bg-white rounded-lg p-5 border-2 border-blue-100 shadow-sm space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="text-xl font-bold text-gray-900">{selectedItem.name || 'Unknown Item'}</h4>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">
                        {selectedItem.category || 'General'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Revenue</p>
                        <p className="text-xl font-bold text-green-600">₹{(selectedItem.revenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Sold</p>
                        <p className="text-xl font-bold text-blue-600">{selectedItem.totalSold || selectedItem.orderCount || 0}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Avg Price</p>
                        <p className="text-lg font-bold text-orange-600">
                          ₹{selectedItem.totalSold > 0 
                            ? (selectedItem.revenue / selectedItem.totalSold).toFixed(0) 
                            : (selectedItem.avgPrice || 0).toFixed(0)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Velocity</p>
                        <p className="text-lg font-bold text-purple-600">{(selectedItem.velocity || 0).toFixed(2)} <small className="text-[10px] text-gray-400">ord/hr</small></p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedItem && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Select a menu item above to see detailed metrics</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
                No menu item data available for this range
              </div>
            )}
          </ChartCard>

          {/* Top Items by Revenue - Neatened Graph */}
          <ChartCard 
            title={`Top ${Math.min(10, menuVelocity.length)} Revenue Items`} 
            className={expandedChart === 'revenue' ? 'lg:col-span-2 order-last lg:order-none' : ''}
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default button behavior
                    setExpandedChart(expandedChart === 'revenue' ? null : 'revenue');
                  }}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  {expandedChart === 'revenue' ? 'Collapse View' : 'Full Width View'}
                </button>
              </div>

              {menuVelocity.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={expandedChart === 'revenue' ? 400 : 330}>
                    <BarChart 
                      data={menuVelocity.slice(0, 10)}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        tick={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }} 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name, props) => [`₹${value.toLocaleString()}`, props.payload.name]}
                        labelFormatter={(label) => ''}
                      />
                      <Bar 
                        dataKey="revenue" 
                        radius={[6, 6, 0, 0]}
                        barSize={expandedChart === 'revenue' ? 60 : 45}
                        animationDuration={1500}
                      >
                        {menuVelocity.slice(0, 10).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={ITEM_COLORS[index % ITEM_COLORS.length]}
                            name={entry.name}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Color Legend */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 uppercase mb-3 tracking-wide sticky top-0 bg-gray-50">Item Legend</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {menuVelocity.slice(0, 10).map((item, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                          <div 
                            className="w-5 h-5 rounded flex-shrink-0" 
                            style={{ backgroundColor: ITEM_COLORS[index % ITEM_COLORS.length] }}
                          />
                          <span className="text-xs font-medium text-gray-700">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Insufficient data for chart
                </div>
              )}
            </div>
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
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, value, percent }) => 
                      `${method}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 space-y-2">
                <CreditCard className="w-8 h-8 opacity-20" />
                <p>No payment data for this period</p>
                <p className="text-xs">Try selecting a different time range (e.g., 7 Days)</p>
              </div>
            )}
          </ChartCard>
        </div>
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

      {/* Section 6: Discounts & Complementary Items */}
      <Section title="Discounts & Complementary Analysis" icon={<Percent className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Discount KPIs */}
          <KPICard
            label="Total Discounts"
            value={formatCurrency(discountData?.totalDiscounts || 0)}
            icon={<Percent className="w-5 h-5 text-orange-600" />}
            valueClassName="text-orange-600"
          />
          <KPICard
            label="Avg Discount/Order"
            value={formatCurrency(discountData?.avgDiscountPerOrder || 0)}
            icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          />
          <KPICard
            label="Discounted Orders"
            value={discountData?.orderCount || 0}
            icon={<ShoppingBag className="w-5 h-5 text-orange-600" />}
          />

          {/* Complementary KPIs */}
          <KPICard
            label="Complementary Amount"
            value={formatCurrency(complementaryData?.totalComplementary || 0)}
            icon={<Gift className="w-5 h-5 text-pink-600" />}
            valueClassName="text-pink-600"
          />
          <KPICard
            label="Avg Complementary"
            value={formatCurrency(complementaryData?.avgComplementaryAmount || 0)}
            icon={<TrendingUp className="w-5 h-5 text-pink-600" />}
          />
          <KPICard
            label="Complementary Orders"
            value={complementaryData?.count || 0}
            icon={<ShoppingBag className="w-5 h-5 text-pink-600" />}
          />

          {/* Cancellation KPIs */}
          <KPICard
            label="Cancelled Orders"
            value={cancellationData?.totalCancelledOrders || 0}
            icon={<Trash2 className="w-5 h-5 text-red-600" />}
            valueClassName="text-red-600"
          />
          <KPICard
            label="Cancellation Rate"
            value={`${(cancellationData?.cancellationRate || 0).toFixed(1)}%`}
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          />
          <KPICard
            label="Cancelled Amount"
            value={formatCurrency(cancellationData?.totalCancelledAmount || 0)}
            icon={<DollarSign className="w-5 h-5 text-red-600" />}
          />
        </div>

        {/* Discount Trends */}
        <ChartCard title="Discount Trends" className="lg:col-span-2 mb-6">
          {discountData?.trends && discountData.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={discountData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Total Discount"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No discount data for this period
            </div>
          )}
        </ChartCard>

        {/* Cancellation Reasons Breakdown */}
        <ChartCard title="Cancellation Reasons Breakdown" className="lg:col-span-2">
          {cancellationData?.cancellationByReason && cancellationData.cancellationByReason.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cancellationData.cancellationByReason}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="reason" stroke="#666" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [value, 'Count']}
                />
                <Legend />
                <Bar dataKey="count" fill="#ef4444" name="Order Count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No cancellation data for this period
            </div>
          )}
        </ChartCard>

        {/* Complementary Reasons Breakdown */}
        <ChartCard title="Complementary Items Breakdown" className="lg:col-span-2">
          {complementaryData?.complementaryByReason && complementaryData.complementaryByReason.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complementaryData.complementaryByReason}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, count, percentage }) => 
                    `${reason}: ${count} (${percentage?.toFixed(0) || 0}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {complementaryData.complementaryByReason.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ITEM_COLORS[index % ITEM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, 'Count']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No complementary data for this period
            </div>
          )}
        </ChartCard>
      </Section>

      {/* Section 7: Coupon Campaign Growth */}
      <Section title="Coupon Campaigns & Customer Growth" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="Coupon Users"
            value={couponGrowthData?.totalCouponUsers || 0}
            icon={<Users className="w-5 h-5 text-purple-600" />}
          />
          <KPICard
            label="New Customers"
            value={couponGrowthData?.newCustomers || 0}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          />
          <KPICard
            label="Returning Customers"
            value={couponGrowthData?.returningCustomers || 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
          />
          <KPICard
            label="Return Rate"
            value={`${(couponGrowthData?.returnRate || 0).toFixed(1)}%`}
            icon={<Percent className="w-5 h-5 text-indigo-600" />}
          />
        </div>

        {/* Customer Growth Trend */}
        <ChartCard title="Customer Growth After Coupon Campaigns" className="lg:col-span-2">
          {couponGrowthData?.growthTrend && couponGrowthData.growthTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={couponGrowthData.growthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="uniqueCustomers"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  name="Unique Customers"
                />
                <Line
                  type="monotone"
                  dataKey="orderCount"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  name="Order Count"
                />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Revenue"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No coupon campaign data for this period
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