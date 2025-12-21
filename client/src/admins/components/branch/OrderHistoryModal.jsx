import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, Download, Filter } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderHistoryModal({ isOpen, onClose, branchId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('today'); // today, yesterday, week, month, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
            // Construct query params
            const params = {
                timeFilter: dateRange,
                startDate: customStart,
                endDate: customEnd,
                status: statusFilter !== 'all' ? statusFilter : undefined
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
        return matchesSearch;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Order History
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">View past orders and transactions</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b bg-white flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search order # or table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="closed">Closed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateRange === 'custom' && (
                            <div className="flex gap-2 items-center">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded px-2 py-1" />
                                <span>-</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded px-2 py-1" />
                            </div>
                        )}

                        <button
                            onClick={fetchHistory}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Refresh"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 border-b font-semibold text-gray-700">Date & Time</th>
                                    <th className="p-3 border-b font-semibold text-gray-700">Order #</th>
                                    <th className="p-3 border-b font-semibold text-gray-700">Table</th>
                                    <th className="p-3 border-b font-semibold text-gray-700">Items</th>
                                    <th className="p-3 border-b font-semibold text-gray-700 text-right">Total</th>
                                    <th className="p-3 border-b font-semibold text-gray-700 text-center">Payment</th>
                                    <th className="p-3 border-b font-semibold text-gray-700 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-gray-600">
                                            {new Date(order.createdAt).toLocaleString('en-GB', { hour12: false })}
                                        </td>
                                        <td className="p-3 font-mono text-gray-900 font-medium">
                                            #{order.orderNumber?.slice(-6)}
                                        </td>
                                        <td className="p-3 text-gray-900">
                                            {order.table?.tableNumber || 'N/A'}
                                        </td>
                                        <td className="p-3 text-gray-600 max-w-[200px] truncate" title={order.items.map(i => i.menuItem?.name).join(', ')}>
                                            {order.items.length} items ({order.items.slice(0, 2).map(i => i.menuItem?.name).join(', ')}{order.items.length > 2 ? '...' : ''})
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredOrders.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            No orders found for the selected range.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center text-sm text-gray-500">
                    <span>Showing {filteredOrders.length} orders</span>
                    <span>Total Value: <b>{formatCurrency(filteredOrders.reduce((sum, o) => sum + o.total, 0))}</b></span>
                </div>
            </div>
        </div>
    );
}
