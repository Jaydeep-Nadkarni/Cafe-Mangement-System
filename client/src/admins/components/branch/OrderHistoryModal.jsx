import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Search, RefreshCw, Download, ChevronDown, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderHistoryModal({ isOpen, onClose, branchId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const tableRef = useRef();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, dateRange, customStart, customEnd]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                timeFilter: dateRange,
                startDate: customStart,
                endDate: customEnd
            };

            const response = await axios.get(`${API_URL}/api/branch/orders`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.table?.tableNumber?.toString().includes(searchTerm);
        const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
        return matchesSearch && matchesPayment;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const paidCount = filteredOrders.filter(o => o.paymentStatus === 'paid').length;
    const averageTransaction = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=1200,height=800');
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order History Report</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        margin: 20px;
                        background: white;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #1f2937;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #1f2937;
                    }
                    .header p {
                        margin: 5px 0;
                        font-size: 13px;
                        color: #6b7280;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-bottom: 25px;
                    }
                    .summary-box {
                        padding: 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .summary-label {
                        font-size: 12px;
                        color: #6b7280;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .summary-value {
                        font-size: 18px;
                        font-weight: bold;
                        color: #1f2937;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th {
                        background-color: #f3f4f6;
                        color: #1f2937;
                        padding: 10px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 12px;
                        border-bottom: 2px solid #d1d5db;
                        text-transform: uppercase;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #e5e7eb;
                        font-size: 13px;
                    }
                    tr:nth-child(even) {
                        background-color: #f9fafb;
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: right;
                        font-size: 12px;
                        color: #6b7280;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 15px;
                    }
                    .amount {
                        text-align: right;
                        font-weight: 500;
                    }
                    .payment-badge {
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    .paid {
                        background-color: #dcfce7;
                        color: #166534;
                    }
                    .unpaid {
                        background-color: #fee2e2;
                        color: #991b1b;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Order History Report</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Period: ${dateRange === 'custom' ? `${customStart} to ${customEnd}` : dateRange}</p>
                </div>

                <div class="summary">
                    <div class="summary-box">
                        <div class="summary-label">Total Orders</div>
                        <div class="summary-value">${filteredOrders.length}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Total Revenue</div>
                        <div class="summary-value">${formatCurrency(totalRevenue)}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Paid Orders</div>
                        <div class="summary-value">${paidCount}</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-label">Avg Transaction</div>
                        <div class="summary-value">${formatCurrency(averageTransaction)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Order ID</th>
                            <th>Table</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.map(order => `
                            <tr>
                                <td>${new Date(order.createdAt).toLocaleString()}</td>
                                <td>#${order.orderNumber?.slice(-6)}</td>
                                <td>${order.table?.tableNumber || 'N/A'}</td>
                                <td class="amount">${formatCurrency(order.total)}</td>
                                <td>${order.paymentMethod || 'N/A'}</td>
                                <td><span class="payment-badge ${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">${order.paymentStatus}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>End of Report</p>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
                
                {/* Professional Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start rounded-t-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Order History</h2>
                        </div>
                        <p className="text-slate-300 text-sm">Comprehensive transaction report and audit trail</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Total Orders</p>
                        <p className="text-2xl font-bold text-slate-900">{filteredOrders.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Paid Orders</p>
                        <p className="text-2xl font-bold text-slate-900">{paidCount} <span className="text-sm text-slate-400">({filteredOrders.length > 0 ? Math.round((paidCount / filteredOrders.length) * 100) : 0}%)</span></p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Avg Transaction</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(averageTransaction)}</p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="px-8 py-5 border-b border-slate-200 bg-white flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by order ID or table number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        >
                            <option value="all">All Payments</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>

                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateRange === 'custom' && (
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="date" 
                                    value={customStart} 
                                    onChange={e => setCustomStart(e.target.value)} 
                                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-400">–</span>
                                <input 
                                    type="date" 
                                    value={customEnd} 
                                    onChange={e => setCustomEnd(e.target.value)} 
                                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={fetchHistory}
                            disabled={loading}
                            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={handlePrint}
                            className="p-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Print report"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full bg-white">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                                <p className="text-slate-500 text-sm">Loading order history...</p>
                            </div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex justify-center items-center h-full bg-white">
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-medium">No orders found</p>
                                <p className="text-slate-400 text-xs">Try adjusting your filters or date range</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white">
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr className="border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/5">Date & Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/6">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/12">Table</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/6">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/5">Payment Method</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-1/6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200" ref={tableRef}>
                                    {filteredOrders.map((order, index) => (
                                        <tr 
                                            key={order._id} 
                                            className="hover:bg-slate-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="font-mono font-semibold text-slate-900">#{order.orderNumber?.slice(-8)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                                {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="capitalize">{order.paymentMethod || 'Cash'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    order.paymentStatus === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Professional Footer */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                        <span className="font-semibold">{filteredOrders.length}</span>
                        <span className="text-slate-500"> orders</span>
                    </div>
                    <div className="text-sm text-slate-600">
                        <span className="text-slate-500">Total Revenue: </span>
                        <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
