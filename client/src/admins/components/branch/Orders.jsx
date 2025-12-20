import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Coffee, XCircle, MessageCircle, Printer, CheckCircle, 
  Plus, Trash2, CreditCard, Banknote, Smartphone, 
  ArrowRightLeft, AlertCircle, Search, X, RefreshCw, Calendar, Clock, ShieldCheck,
  ChefHat, Truck, Package, DollarSign, Archive
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';
import ConfirmationModal from './ConfirmationModal';

export default function Orders({ tables, menu = [], onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, card, upi
  const [cashReceived, setCashReceived] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedOrdersForMerge, setSelectedOrdersForMerge] = useState([]);
  const [mergePreview, setMergePreview] = useState(null);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    isLoading: false,
    onConfirm: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch all orders with time filter
  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('token');
      let params = { timeFilter };

      if (timeFilter === 'custom' && customStartDate) {
        params.startDate = customStartDate;
        if (customEndDate) {
          params.endDate = customEndDate;
        }
      }

      const response = await axios.get(`${API_URL}/api/branch/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: `Failed to fetch orders: ${error.response?.data?.message || error.message}`,
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, timeFilter, customStartDate, customEndDate]);

  // Initial load and when time filter changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates via webhook/polling simulation
  useEffect(() => {
    // Listen for payment confirmations or order updates
    const handlePaymentUpdate = (event) => {
      if (event.detail?.orderId) {
        fetchOrders(true); // Soft refresh
      }
    };

    window.addEventListener('payment_confirmed', handlePaymentUpdate);
    window.addEventListener('order_updated', handlePaymentUpdate);

    return () => {
      window.removeEventListener('payment_confirmed', handlePaymentUpdate);
      window.removeEventListener('order_updated', handlePaymentUpdate);
    };
  }, [fetchOrders]);

  // Soft refresh handler
  const handleSoftRefresh = () => {
    fetchOrders(true);
  };

  // Time filter options
  const timeFilters = [
    { value: '1h', label: '1 Hour' },
    { value: '3h', label: '3 Hours' },
    { value: '6h', label: '6 Hours' },
    { value: 'today', label: 'Today' },
    { value: 'custom', label: 'Custom' }
  ];

  // Apply custom date filter
  const applyCustomFilter = () => {
    if (!customStartDate) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Please select a start date',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
      return;
    }
    setShowCustomDateModal(false);
    fetchOrders();
  };

  // Derived state
  const activeTables = useMemo(() => 
    tables.filter(t => t.currentOrder && t.currentOrder._id !== selectedOrder?._id),
    [tables, selectedOrder]
  );

  const filteredMenu = useMemo(() => 
    menu.filter(item => 
      item.isAvailable && 
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    ),
    [menu, itemSearch]
  );

  // Actions
  const handleAddItem = async (menuItem) => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/orders/${selectedOrder._id}/items`, {
        items: [{ menuItemId: menuItem._id, quantity: 1 }]
      });
      setSelectedOrder(res.data);
      fetchOrders(true);
      onRefresh();
      setShowAddItem(false);
    } catch (error) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: `Failed to add item: ${error.response?.data?.message || error.message}`,
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    showConfirmation(
      'Remove Item',
      'Remove this item from order?',
      async () => {
        try {
          setLoading(true);
          const res = await axios.delete(`${API_URL}/api/orders/${selectedOrder._id}/items/${itemId}`);
          setSelectedOrder(res.data);
          fetchOrders(true);
          onRefresh();
        } catch (error) {
          showError('Failed to remove item: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleCancelOrder = async () => {
    showConfirmation(
      'Cancel Order',
      'Are you sure you want to CANCEL this entire order? This cannot be undone.',
      async () => {
        try {
          setLoading(true);
          await axios.post(`${API_URL}/api/orders/${selectedOrder._id}/cancel`);
          setSelectedOrder(null);
          fetchOrders(true);
          onRefresh();
        } catch (error) {
          showError('Failed to cancel order: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // New merge functions with preview
  const handleStartMerge = () => {
    setSelectedOrdersForMerge([]);
    setMergePreview(null);
    setShowMergeModal(true);
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrdersForMerge(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleGetMergePreview = async () => {
    if (selectedOrdersForMerge.length < 2) {
      showError('Please select at least 2 orders to merge');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/orders/merge/preview`,
        { orderIds: selectedOrdersForMerge },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMergePreview(response.data);
      setShowMergePreview(true);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to get merge preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMerge = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/orders/merge`,
        { orderIds: selectedOrdersForMerge },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowMergePreview(false);
      setShowMergeModal(false);
      setSelectedOrdersForMerge([]);
      setMergePreview(null);
      fetchOrders(true);
      onRefresh();
      
      showSuccess(`Successfully merged ${response.data.mergedOrderIds.length + 1} orders`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to merge orders');
    } finally {
      setLoading(false);
    }
  };

  // Custom confirmation modal helper
  const showConfirmation = (title, message, onConfirm) => {
    setConfirmAction({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const showError = (message) => {
    setConfirmAction({ title: 'Error', message, isError: true });
    setShowConfirmModal(true);
  };

  const showSuccess = (message) => {
    setConfirmAction({ title: 'Success', message, isSuccess: true });
    setShowConfirmModal(true);
  };

  const handleCheckout = async () => {
    if (paymentMode === 'cash' && (!cashReceived || parseFloat(cashReceived) < selectedOrder.total)) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Please enter valid cash amount',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
      return;
    }

    setModalState({
      isOpen: true,
      title: 'Confirm Payment',
      description: `Confirm payment of ${formatCurrency(selectedOrder.total)} via ${paymentMode.toUpperCase()}?`,
      confirmText: 'Complete Payment',
      cancelText: 'Cancel',
      isDangerous: false,
      onConfirm: async () => {
        try {
          setLoading(true);
          await axios.post(`${API_URL}/api/orders/${selectedOrder._id}/checkout`, {
            paymentMethod: paymentMode,
            amountPaid: paymentMode === 'cash' ? parseFloat(cashReceived) : selectedOrder.total
          });
          setSelectedOrder(null);
          
          // Trigger payment confirmation event for real-time update
          window.dispatchEvent(new CustomEvent('payment_confirmed', { 
            detail: { orderId: selectedOrder._id } 
          }));
          
          fetchOrders(true); // Soft refresh
          onRefresh();
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          setModalState({
            isOpen: true,
            title: 'Error',
            description: `Checkout failed: ${error.response?.data?.message || error.message}`,
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSendBill = async (orderId, phoneNumber) => {
    if (!phoneNumber) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Please enter a phone number',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
      return;
    }
    try {
      await axios.post(`${API_URL}/api/orders/${orderId}/send-whatsapp-bill`, {
        phoneNumber
      });
      setModalState({
        isOpen: true,
        title: 'Success',
        description: 'Bill sent successfully!',
        confirmText: 'OK',
        isDangerous: false,
        onConfirm: null
      });
    } catch (error) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to send bill',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    }
  };

  // Handle order status transition
  const handleStatusTransition = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh orders
      await fetchOrders(true);
      
      showSuccess(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // Handle close order (PAID → CLOSED)
  const handleCloseOrder = async (orderId) => {
    showConfirmation(
      'Close Order',
      'Are you sure you want to close this order? The table will be marked as available.',
      async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_URL}/api/orders/${orderId}/close`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          // Close modal and refresh
          setSelectedOrder(null);
          await fetchOrders(true);
          
          showSuccess('Order closed successfully!');
        } catch (error) {
          showError(error.response?.data?.message || 'Failed to close order');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Get status badge configuration
  const getStatusBadge = (status) => {
    const statusConfig = {
      created: {
        label: 'Created',
        icon: Package,
        color: 'bg-gray-100 text-gray-700 border-gray-300'
      },
      confirmed: {
        label: 'Confirmed',
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-700 border-blue-300'
      },
      preparing: {
        label: 'Preparing',
        icon: ChefHat,
        color: 'bg-orange-100 text-orange-700 border-orange-300'
      },
      ready: {
        label: 'Ready',
        icon: Truck,
        color: 'bg-purple-100 text-purple-700 border-purple-300'
      },
      paid: {
        label: 'Paid',
        icon: DollarSign,
        color: 'bg-green-100 text-green-700 border-green-300'
      },
      closed: {
        label: 'Closed',
        icon: Archive,
        color: 'bg-gray-100 text-gray-600 border-gray-300'
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300'
      }
    };
    return statusConfig[status] || statusConfig.created;
  };

  // Get next valid status for transition
  const getNextStatus = (currentStatus) => {
    const flow = {
      created: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'paid',
      paid: 'closed',
      closed: null
    };
    return flow[currentStatus];
  };

  // Color coding helper
  const getOrderColorClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          header: 'bg-green-100 border-green-200',
          badge: 'bg-green-200 text-green-800'
        };
      case 'unpaid':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          header: 'bg-red-100 border-red-200',
          badge: 'bg-red-200 text-red-800'
        };
      default: // partial or refunded
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          header: 'bg-amber-100 border-amber-200',
          badge: 'bg-amber-200 text-amber-800'
        };
    }
  };

  return (
    <div className="h-full">
      {/* Header with filters */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
            <p className="text-gray-500">View and manage all orders (paid/unpaid)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSoftRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 transition-colors disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1  text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Paid</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1  text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Unpaid</span>
            </div>
          </div>
        </div>

        {/* Time filter buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <Clock className="w-4 h-4 text-gray-400" />
          {timeFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => {
                setTimeFilter(filter.value);
                if (filter.value === 'custom') {
                  setShowCustomDateModal(true);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === filter.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
          {loading && (
            <div className="ml-2 w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => {
          const colors = getOrderColorClass(order.paymentStatus);
          const statusBadge = getStatusBadge(order.status);
          const StatusIcon = statusBadge.icon;
          
          return (
            <div 
              key={order._id} 
              onClick={() => setSelectedOrder(order)}
              className={`bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${colors.border} ${colors.bg}`}
            >
              <div className={`p-4 border-b flex justify-between items-center ${colors.header}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg text-gray-900">
                    {order.table ? `Table ${order.table.tableNumber}` : 'No Table'}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border font-medium ${statusBadge.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusBadge.label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${colors.badge}`}>
                    {order.paymentStatus}
                  </span>
                  {order.isMerged && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      MERGED
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500 font-mono">#{order.orderNumber?.slice(-6)}</span>
              </div>
              
              <div className="p-4">
                <div className="space-y-2 mb-4 min-h-20">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.quantity}x</span> 
                        {item.menuItem?.name || 'Unknown Item'}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs text-gray-400 italic pl-6">
                      + {order.items.length - 3} more items...
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(order.total)}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {orders.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Coffee className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No orders found</p>
            <p className="text-sm">Orders for the selected time period will appear here</p>
          </div>
        )}
      </div>

      {/* Custom Date Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Custom Date Range</h3>
              <button onClick={() => setShowCustomDateModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={applyCustomFilter}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row md:h-[90vh]">
            
            {/* LEFT COLUMN: Items & Actions */}
            <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50/50 min-h-0">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Table {selectedOrder.table?.tableNumber || '?'}</span>
                      <span>•</span>
                      <span>{selectedOrder.items.length} Items</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowMergeModal(true)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Merge Order"
                    >
                      <ArrowRightLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleCancelOrder}
                      disabled={['paid', 'closed', 'cancelled'].includes(selectedOrder.status)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel Order"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status Badge and Transition */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusBadge = getStatusBadge(selectedOrder.status);
                    const StatusIcon = statusBadge.icon;
                    const nextStatus = getNextStatus(selectedOrder.status);
                    
                    return (
                      <>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${statusBadge.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusBadge.label}
                        </div>
                        
                        {nextStatus && !['cancelled', 'closed'].includes(selectedOrder.status) && (
                          <>
                            <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                            <button
                              onClick={() => handleStatusTransition(selectedOrder._id, nextStatus)}
                              disabled={loading || (nextStatus === 'paid' && selectedOrder.status !== 'ready')}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(() => {
                                const nextBadge = getStatusBadge(nextStatus);
                                const NextIcon = nextBadge.icon;
                                return (
                                  <>
                                    <NextIcon className="w-4 h-4" />
                                    {nextBadge.label}
                                  </>
                                );
                              })()}
                            </button>
                          </>
                        )}

                        {selectedOrder.status === 'paid' && (
                          <>
                            <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                            <button
                              onClick={() => handleCloseOrder(selectedOrder._id)}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <Archive className="w-4 h-4" />
                              Close
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-bold">{item.quantity}x</span>
                        <span className="font-medium text-gray-900">{item.menuItem?.name}</span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-1 ml-9 italic">"{item.specialInstructions}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                      <button 
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Item Button */}
                <button 
                  onClick={() => setShowAddItem(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>

              {/* Chef Notes */}
              {selectedOrder.chefNotes && (
                <div className="p-4 bg-amber-50 border-t border-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase">Chef Notes</p>
                      <p className="text-sm text-amber-800">{selectedOrder.chefNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Payment & Summary */}
            <div className="w-full md:w-96 bg-white flex flex-col md:min-h-0">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-gray-900">Bill Summary</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Customer Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Customer</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customerName || 'Guest'}</p>
                    </div>
                    {selectedOrder.customerPhone && (
                      <button 
                        onClick={() => handleSendBill(selectedOrder._id, selectedOrder.customerPhone)}
                        className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                        title="WhatsApp Bill"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {selectedOrder.customerPhone && (
                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  )}
                </div>

                {/* Bill Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.coupon && (
                    <div className="flex justify-between text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                      <span>Coupon Applied</span>
                      <span>{selectedOrder.coupon.code}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-900 text-lg">Total</span>
                      <span className="font-bold text-gray-900 text-2xl">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="mt-8">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button 
                      onClick={() => setPaymentMode('cash')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        paymentMode === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Cash</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMode('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        paymentMode === 'card' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Card</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMode('upi')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        paymentMode === 'upi' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">UPI</span>
                    </button>
                  </div>

                  {paymentMode === 'cash' && (
                    <div className="bg-gray-50 p-4 rounded-xl mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cash Received</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                        <input 
                          type="number" 
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      {cashReceived && parseFloat(cashReceived) >= selectedOrder.total && (
                        <div className="mt-2 flex justify-between items-center text-sm">
                          <span className="text-gray-600">Change to return:</span>
                          <span className="font-bold text-green-600">{formatCurrency(parseFloat(cashReceived) - selectedOrder.total)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
                {selectedOrder.status === 'ready' && selectedOrder.paymentStatus === 'unpaid' ? (
                  <button 
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Complete Payment
                      </>
                    )}
                  </button>
                ) : selectedOrder.status === 'paid' ? (
                  <button 
                    onClick={() => handleCloseOrder(selectedOrder._id)}
                    disabled={loading}
                    className="w-full py-4 bg-gray-600 text-white rounded-xl font-bold text-lg hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Archive className="w-6 h-6" />
                    Close Order
                  </button>
                ) : ['closed', 'cancelled'].includes(selectedOrder.status) ? (
                  <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-bold text-lg text-center">
                    Order {selectedOrder.status === 'closed' ? 'Closed' : 'Cancelled'}
                  </div>
                ) : (
                  <div className="w-full py-4 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm text-center border border-blue-200">
                    Order must be in READY status before payment
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Merge Order</h3>
            <p className="text-gray-500 mb-4 text-sm">Select a table to merge the current order into.</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {activeTables.length === 0 ? (
                <p className="text-center text-gray-400 py-4">No other active tables available.</p>
              ) : (
                activeTables.map(table => (
                  <button
                    key={table._id}
                    onClick={() => setMergeTargetId(table._id)}
                    className={`w-full p-3 rounded-lg border flex justify-between items-center ${
                      mergeTargetId === table._id 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold">Table {table.tableNumber}</span>
                    <span className="text-sm">{formatCurrency(table.currentOrder.total)}</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowMergeModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleMergeOrder}
                disabled={!mergeTargetId || loading}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Add Item to Order</h3>
              <button onClick={() => setShowAddItem(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search menu items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-1 gap-2">
                {filteredMenu.map(item => (
                  <button
                    key={item._id}
                    onClick={() => handleAddItem(item)}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDangerous={modalState.isDangerous}
        isLoading={modalState.isLoading}
      />

      {/* Merge Selection Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Merge Orders</h2>
                  <p className="text-gray-500 text-sm">Select 2 or more unpaid orders from the same table</p>
                </div>
                <button onClick={() => setShowMergeModal(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.filter(o => o.paymentStatus === 'unpaid' && !o.isMerged).map(order => {
                  const isSelected = selectedOrdersForMerge.includes(order._id);
                  return (
                    <div
                      key={order._id}
                      onClick={() => toggleOrderSelection(order._id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOrderSelection(order._id)}
                            className="w-5 h-5 text-purple-600 rounded"
                          />
                          <span className="font-bold text-gray-900">
                            Table {order.table?.tableNumber || '?'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          #{order.orderNumber?.slice(-6)}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            {item.quantity}x {item.menuItem?.name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-gray-400">+{order.items.length - 2} more</div>
                        )}
                      </div>
                      <div className="font-bold text-purple-700">{formatCurrency(order.total)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">{selectedOrdersForMerge.length}</span> orders selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGetMergePreview}
                    disabled={selectedOrdersForMerge.length < 2}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Preview Merge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Preview Modal */}
      {showMergePreview && mergePreview && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-purple-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Merge Preview</h2>
                  <p className="text-sm text-gray-600">
                    Merging {mergePreview.orderCount} orders into one
                  </p>
                </div>
                <button onClick={() => setShowMergePreview(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Source Orders */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Source Orders</h3>
                <div className="grid grid-cols-2 gap-3">
                  {mergePreview.orders.map((order, idx) => (
                    <div key={order._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono text-gray-500">#{order.orderNumber}</span>
                        <span className="text-sm font-bold text-gray-700">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="text-xs text-gray-600">{order.itemCount} items</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center my-4">
                <ArrowRightLeft className="w-6 h-6 text-purple-600" />
              </div>

              {/* Combined Order Preview */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-purple-900 uppercase mb-4">Combined Order</h3>
                
                <div className="space-y-2 mb-4">
                  {mergePreview.combined.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        <span className="font-bold">{item.quantity}x</span> {item.menuItem?.name}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-purple-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(mergePreview.combined.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(mergePreview.combined.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-bold text-2xl text-purple-700">
                      {formatCurrency(mergePreview.combined.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-purple-800">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-bold">
                      {mergePreview.combined.totalQuantity} items from {mergePreview.orderCount} orders
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMergePreview(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMerge}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Merge
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
