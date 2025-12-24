import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Coffee, XCircle, MessageCircle, Printer, CheckCircle,
  Plus, Trash2, CreditCard, Banknote, Smartphone,
  ArrowRightLeft, AlertCircle, Search, X, RefreshCw, Calendar, Clock, ShieldCheck,
  ChefHat, Truck, Package, DollarSign, Archive, Eye
} from 'lucide-react';
import axios from 'axios';
import { useBranchSocket } from '../../../user/hooks/useBranchSocket';
import { formatCurrency, formatTime, formatDateTime } from '../../../utils/formatCurrency';
import ConfirmationModal from './ConfirmationModal';
import OrderHistoryModal from './OrderHistoryModal';
import Invoice from './Invoice';
import OrderModal from './OrderModal';

// Helper to group items for display
const groupOrderItems = (items) => {
  if (!items) return [];
  const groups = {};
  items.forEach(item => {
    const key = `${item.menuItem?._id}-${item.specialInstructions || ''}-${item.price}`;
    if (!groups[key]) {
      groups[key] = { ...item, quantity: 0 };
    }
    groups[key].quantity += item.quantity;
  });
  return Object.values(groups);
};

const getTimeSince = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function Orders({ tables, menu = [], onRefresh }) {
    // State for By Table modal
    const [selectedTableForModal, setSelectedTableForModal] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, card, upi
  const [cashReceived, setCashReceived] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState(null);
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
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

  // Search and filter state
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchCustomerPhone, setSearchCustomerPhone] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Determine branch from tables (for socket room)
  const branchId = tables?.[0]?.branch?._id || tables?.[0]?.branch || null;

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

      // Add search parameters
      if (searchCustomerName) {
        params.customerName = searchCustomerName;
      }
      if (searchCustomerPhone) {
        params.customerPhone = searchCustomerPhone;
      }
      if (searchStartDate) {
        params.specificDate = searchStartDate;
      }
      if (searchEndDate) {
        params.endDate = searchEndDate;
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
        description: 'Failed to load orders. Please check your connection and try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, timeFilter, customStartDate, customEndDate, searchCustomerName, searchCustomerPhone, searchStartDate, searchEndDate]);

  // Initial load and when time filter changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates via webhook/polling simulation
  const handlePaymentUpdate = useCallback((event) => {
    if (event.detail?.orderId) {
      fetchOrders(true); // Soft refresh
    }
  }, [fetchOrders]);

  useEffect(() => {
    window.addEventListener('payment_confirmed', handlePaymentUpdate);
    window.addEventListener('order_updated', handlePaymentUpdate);
    return () => {
      window.removeEventListener('payment_confirmed', handlePaymentUpdate);
      window.removeEventListener('order_updated', handlePaymentUpdate);
    };
  }, [handlePaymentUpdate]);

  // Socket-based updates for order item changes
  useBranchSocket(branchId, {
    onOrderItemsUpdated: async (payload) => {
      fetchOrders(true);
      if (selectedOrder && payload.orderId === selectedOrder._id) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_URL}/api/orders/${selectedOrder._id}`, { headers: { Authorization: `Bearer ${token}` } });
          setSelectedOrder(res.data);
        } catch (err) {
          console.error('Failed to refresh selected order:', err);
        }
      }
    }
  });

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

  // Group items for display
  const groupedItems = useMemo(() => {
    if (!selectedOrder) return [];
    const groups = {};
    selectedOrder.items.forEach(item => {
      // Group by MenuItem ID + Special Instructions + Price
      const key = `${item.menuItem?._id}-${item.specialInstructions || ''}-${item.price}`;
      
      if (!groups[key]) {
        groups[key] = {
          ...item,
          quantity: 0,
          originalItems: [] // Keep track of original items for updates
        };
      }
      groups[key].quantity += item.quantity;
      groups[key].originalItems.push(item);
    });
    return Object.values(groups);
  }, [selectedOrder]);

  const handleUpdateGroupQuantity = async (group, newTotalQuantity) => {
    const diff = newTotalQuantity - group.quantity;
    if (diff === 0) return;

    // We operate on the last item in the group (most recent)
    const lastItem = group.originalItems[group.originalItems.length - 1];
    
    if (diff > 0) {
      // Increase quantity of the last item
      await handleUpdateItemQuantity(lastItem._id, lastItem.quantity + diff);
    } else {
      // Decrease quantity
      // If the decrease is less than the last item's quantity, just reduce it
      if (lastItem.quantity > Math.abs(diff)) {
        await handleUpdateItemQuantity(lastItem._id, lastItem.quantity + diff);
      } else {
        // If we need to remove the item entirely or more
        // For simplicity, we just remove the last item if it goes to 0 or below
        // The user can click '-' again to reduce the next item
        await handleRemoveItem(lastItem._id);
      }
    }
  };

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
      console.error('Failed to add item:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to add item to order. Please try again.',
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
          showSuccess('Item removed');
        } catch (error) {
          console.error('Failed to remove item:', error);
          showError('Failed to remove item. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleMarkAsPaid = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/orders/${orderId}/checkout`, {
        paymentMethod: 'cash',
        amountPaid: selectedOrder.total
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSelectedOrder(res.data);
      fetchOrders(true);
      onRefresh();
      showSuccess('Order marked as paid');
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      showError(error?.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemQuantity = async (itemId, quantity) => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/orders/${selectedOrder._id}/items/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedOrder(res.data);
      fetchOrders(true);
      onRefresh();
      showSuccess('Quantity updated');
    } catch (error) {
      console.error('Failed to update quantity:', error);
      showError(error?.response?.data?.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
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
          console.error('Failed to cancel order:', error);
          showError('Failed to cancel order. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // New merge functions with preview
  const handleMergeOrder = async () => {
    if (!mergeTargetId || !selectedOrder) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Merge selectedOrder INTO mergeTargetId
      await axios.post(
        `${API_URL}/api/orders/merge`,
        { orderIds: [mergeTargetId, selectedOrder._id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowMergeModal(false);
      setMergeTargetId(null);
      setSelectedOrder(null);
      fetchOrders(true);
      onRefresh();

      showSuccess('Order merged successfully!');
    } catch (error) {
      console.error('Failed to merge order:', error);
      showError('Failed to merge order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to get merge preview:', error);
      showError('Failed to preview merge. Please try again.');
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
      console.error('Failed to merge orders:', error);
      showError('Failed to merge orders. Please try again.');
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
    // Validate payment mode
    if (!paymentMode) {
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Please select a payment method',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
      return;
    }

    // Validate cash payment amount
    if (paymentMode === 'cash') {
      if (!cashReceived) {
        setModalState({
          isOpen: true,
          title: 'Error',
          description: 'Please enter the amount received',
          confirmText: 'OK',
          isDangerous: true,
          onConfirm: null
        });
        return;
      }

      const receivedAmount = parseFloat(cashReceived);
      if (isNaN(receivedAmount)) {
        setModalState({
          isOpen: true,
          title: 'Error',
          description: 'Please enter a valid amount',
          confirmText: 'OK',
          isDangerous: true,
          onConfirm: null
        });
        return;
      }

      if (receivedAmount < selectedOrder.total) {
        setModalState({
          isOpen: true,
          title: 'Error',
          description: `Insufficient amount. Order total: ${formatCurrency(selectedOrder.total)}, Received: ${formatCurrency(receivedAmount)}`,
          confirmText: 'OK',
          isDangerous: true,
          onConfirm: null
        });
        return;
      }
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
          const token = localStorage.getItem('token');
          await axios.post(`${API_URL}/api/orders/${selectedOrder._id}/checkout`, {
            paymentMethod: paymentMode,
            amountPaid: paymentMode === 'cash' ? parseFloat(cashReceived) : selectedOrder.total
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setSelectedOrder(null);
          setCashReceived('');

          // Trigger payment confirmation event for real-time update
          window.dispatchEvent(new CustomEvent('payment_confirmed', {
            detail: { orderId: selectedOrder._id }
          }));

          fetchOrders(true); // Soft refresh
          onRefresh();
          
          setModalState({
            isOpen: true,
            title: 'Success',
            description: 'Payment completed successfully!',
            confirmText: 'OK',
            isDangerous: false,
            onConfirm: () => setModalState({ ...modalState, isOpen: false })
          });
        } catch (error) {
          console.error('Checkout failed:', error);
          const errorMessage = error?.response?.data?.message || 'Payment processing failed. Please try again.';
          setModalState({
            isOpen: true,
            title: 'Error',
            description: errorMessage,
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

  const handlePrintBill = async (orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/orders/${orderId}/bill`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill-${orderId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess('Bill generated successfully');
    } catch (error) {
      console.error('Download failed:', error);
      showError('Failed to generate bill');
    } finally {
      setLoading(false);
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
      console.error('Failed to update order status:', error);
      showError('Failed to update order status. Please try again.');
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
          console.error('Failed to close order:', error);
          showError('Failed to close order. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Get status badge configuration (REMOVED as per request)
  // const getStatusBadge = (status) => { ... }
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
      created: 'preparing',
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
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex h-fit">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                By Table
              </button>
            </div>

            <button
              onClick={handleSoftRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 transition-colors disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              title="View History"
            >
              <Calendar className="w-4 h-4" />
              History
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Name Search */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchCustomerName}
                  onChange={(e) => setSearchCustomerName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      fetchOrders();
                    }
                  }}
                  className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchCustomerName && (
                  <button
                    onClick={() => setSearchCustomerName('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Customer Phone Search */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Search by phone..."
                  value={searchCustomerPhone}
                  onChange={(e) => setSearchCustomerPhone(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      fetchOrders();
                    }
                  }}
                  className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchCustomerPhone && (
                  <button
                    onClick={() => setSearchCustomerPhone('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      fetchOrders();
                    }
                  }}
                  className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchStartDate && (
                  <button
                    onClick={() => setSearchStartDate('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* End Date */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      fetchOrders();
                    }
                  }}
                  className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchEndDate && (
                  <button
                    onClick={() => setSearchEndDate('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Action Buttons */}
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => {
                setSearchCustomerName('');
                setSearchCustomerPhone('');
                setSearchStartDate('');
                setSearchEndDate('');
                setTimeFilter('today');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Time filter buttons - REMOVED for Table-First enforcement */}
        {/* <div className="flex flex-wrap gap-2 items-center">
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
        </div> */}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewMode === 'list' ? (
          orders.filter(o => !o.isMerged).map(order => {
            const colors = getOrderColorClass(order.paymentStatus);
            return (
              <div
                key={order._id}
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
                className={`bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${colors.border} ${colors.bg}`}
              >
                <div className={`p-4 border-b flex justify-between items-center ${colors.header}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg text-gray-900">
                      {order.table ? `Table ${order.table.tableNumber}` : 'No Table'}
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
                    {groupOrderItems(order.items).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <span className="font-bold text-gray-900">{item.quantity}x</span>
                          {item.menuItem?.name || item.name || 'Unnamed Item'}
                        </span>
                      </div>
                    ))}
                    {groupOrderItems(order.items).length > 3 && (
                      <div className="text-xs text-gray-400 italic pl-6">
                        + {groupOrderItems(order.items).length - 3} more items...
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(order.total)}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <>
            {tables.map(table => {
              const relatedOrders = orders.filter(o => o.table?._id === table._id && !o.isMerged);
              const total = relatedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const unpaid = relatedOrders.filter(o => o.paymentStatus !== 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
              return (
                <div
                  key={table._id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer flex flex-col`}
                  onClick={() => setSelectedTableForModal(table)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg text-gray-900">Table {table.tableNumber}</span>
                    <span className={`w-3 h-3 rounded-full ${table.status === 'occupied' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-gray-500">{relatedOrders.length} Active Order{relatedOrders.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(total)}</span></span>
                    {unpaid > 0 && <span className="text-xs text-red-600">Unpaid: {formatCurrency(unpaid)}</span>}
                  </div>
                </div>
              );
            })}

            {/* By Table Modal: Show all orders for selected table */}
            {selectedTableForModal && (() => {
              const tableOrders = orders.filter(o => o.table?._id === selectedTableForModal._id && !o.isMerged);
              
              // Calculate Session Totals
              const sessionTotal = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const paidAmount = tableOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
              const unpaidAmount = sessionTotal - paidAmount;
              
              // Group all items from all orders in the session
              const allSessionItems = tableOrders.flatMap(o => o.items.map(item => ({
                ...item,
                orderId: o._id,
                isPaid: o.paymentStatus === 'paid'
              })));
              
              const groupedSessionItems = groupOrderItems(allSessionItems);

              return (
              <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4" onClick={() => setSelectedTableForModal(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  
                  {/* Header */}
                  <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">Table {selectedTableForModal.tableNumber}</h2>
                      <span className={`w-3 h-3 rounded-full ${selectedTableForModal.status === 'occupied' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className="text-sm text-gray-500 capitalize">{selectedTableForModal.status}</span>
                    </div>
                    <button onClick={() => setSelectedTableForModal(null)}><X className="w-6 h-6 text-gray-400" /></button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    
                    {/* LEFT: Items List */}
                    <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200 bg-gray-50/30">
                      <h3 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Session Items</h3>
                      
                      {groupedSessionItems.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No items ordered yet.</div>
                      ) : (
                        <div className="space-y-2">
                          {groupedSessionItems.map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${item.isPaid ? 'bg-green-50 border-green-100' : 'bg-white border-gray-200'}`}>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{item.quantity}x</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{item.menuItem?.name || 'Unknown'}</p>
                                  {item.isPaid && <span className="text-[10px] font-bold text-green-600 uppercase bg-green-100 px-1.5 py-0.5 rounded">Paid</span>}
                                </div>
                              </div>
                              <span className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Payment & Actions */}
                    <div className="w-full md:w-96 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                      <div className="p-6 flex-1 overflow-y-auto">
                        <h3 className="font-bold text-gray-900 mb-6">Payment Summary</h3>
                        
                        <div className="space-y-3 text-sm mb-6">
                          <div className="flex justify-between text-gray-600">
                            <span>Session Total</span>
                            <span className="font-medium">{formatCurrency(sessionTotal)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Paid (Online)</span>
                            <span className="font-medium">-{formatCurrency(paidAmount)}</span>
                          </div>
                          <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-gray-900 text-lg">Pending Amount</span>
                              <span className="font-bold text-red-600 text-2xl">{formatCurrency(unpaidAmount)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Methods */}
                        {unpaidAmount > 0 ? (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Payment Method</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <button
                                onClick={() => setPaymentMode('cash')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <Banknote className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Cash</span>
                              </button>
                              <button
                                onClick={() => setPaymentMode('card')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'card' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <CreditCard className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Card</span>
                              </button>
                              <button
                                onClick={() => setPaymentMode('upi')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'upi' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <Smartphone className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">UPI</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="font-bold text-green-800">Fully Paid</p>
                            <p className="text-xs text-green-600">All items in this session are paid.</p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        {unpaidAmount > 0 ? (
                          <button 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const token = localStorage.getItem('token');
                                await axios.post(`${API_URL}/api/orders/session-checkout/${selectedTableForModal._id}`, {
                                  paymentMethod: paymentMode,
                                  amountPaid: unpaidAmount // Charge only pending
                                }, { headers: { Authorization: `Bearer ${token}` } });
                                setSelectedTableForModal(null);
                                fetchOrders(true);
                                onRefresh();
                                showSuccess(`Session closed! Payment of ${formatCurrency(unpaidAmount)} received.`);
                              } catch (error) {
                                showError(error?.response?.data?.message || 'Failed to close session');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Banknote className="w-6 h-6" />
                            Pay {formatCurrency(unpaidAmount)}
                          </button>
                        ) : (
                          <button 
                            onClick={async () => {
                              // Close session without payment (since already paid)
                              try {
                                setLoading(true);
                                const token = localStorage.getItem('token');
                                // We can use the same endpoint, amountPaid 0 is fine if total is 0? 
                                // Actually session-checkout should handle "close only" if fully paid.
                                await axios.post(`${API_URL}/api/orders/session-checkout/${selectedTableForModal._id}`, {
                                  paymentMethod: 'cash', // Dummy
                                  amountPaid: 0
                                }, { headers: { Authorization: `Bearer ${token}` } });
                                setSelectedTableForModal(null);
                                fetchOrders(true);
                                onRefresh();
                                showSuccess(`Session closed successfully.`);
                              } catch (error) {
                                showError(error?.response?.data?.message || 'Failed to close session');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="w-full py-4 bg-gray-800 text-white rounded-xl font-bold text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                          >
                            <Archive className="w-6 h-6" />
                            Close Session & Free Table
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}
          </>
        )}
      </div>

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
                      onClick={() => setShowInvoice(selectedOrder)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Print Invoice"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
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
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {groupedItems.map((group, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-all group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{group.quantity}x</span>
                        <span className="text-sm text-gray-700 truncate">{group.menuItem?.name || 'Unknown Item'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateGroupQuantity(group, Math.max(0, group.quantity - 1))}
                          className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                        >
                          −
                        </button>
                        <span className="text-xs text-gray-500">{group.quantity}</span>
                        <button
                          onClick={() => handleUpdateGroupQuantity(group, group.quantity + 1)}
                          className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 whitespace-nowrap">{formatCurrency(group.price * group.quantity)}</span>
                      <button
                        onClick={() => handleRemoveItem(group.originalItems[group.originalItems.length - 1]._id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setShowAddItem(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMode('card')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'card' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMode('upi')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMode === 'upi' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
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
                {selectedOrder.paymentStatus === 'unpaid' && !['cancelled', 'closed'].includes(selectedOrder.status) ? (
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
                ) : selectedOrder.paymentStatus !== 'paid' ? (
                  <button
                    onClick={() => handleMarkAsPaid(selectedOrder._id)}
                    disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-6 h-6" />
                    Complete Payment
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
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal (Single Order) */}
      {showMergeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Merge Order</h3>
            <p className="text-gray-500 mb-4 text-sm">Select a table to merge the current order into.</p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {/* Same Table Orders */}
              {orders.filter(o =>
                o.table?._id === selectedOrder.table?._id &&
                o._id !== selectedOrder._id &&
                o.paymentStatus === 'unpaid' &&
                !['closed', 'cancelled'].includes(o.status)
              ).map(order => (
                <button
                  key={order._id}
                  onClick={() => setMergeTargetId(order._id)}
                  className={`w-full p-3 rounded-lg border flex justify-between items-center ${mergeTargetId === order._id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                    }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">#{order.orderNumber} (Same Table)</span>
                    <span className="text-xs text-gray-500">{formatTime(order.createdAt)}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                </button>
              ))}

              {/* Other Active Tables */}
              {activeTables.map(table => (
                <button
                  key={table._id}
                  onClick={() => setMergeTargetId(table.currentOrder?._id)}
                  className={`w-full p-3 rounded-lg border flex justify-between items-center ${mergeTargetId === table.currentOrder?._id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <span className="font-bold">Table {table.tableNumber}</span>
                  <span className="text-sm">{formatCurrency(table.currentOrder?.total || 0)}</span>
                </button>
              ))}

              {activeTables.length === 0 && orders.filter(o => o.table?._id === selectedOrder.table?._id && o._id !== selectedOrder._id).length === 0 && (
                <p className="text-center text-gray-400 py-4">No other active orders available to merge.</p>
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
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
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

      {/* Merge Selection Modal (Bulk) */}
      {showMergeModal && !selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
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
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
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
        <div className="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4">
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
      <OrderHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setShowInvoice(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="p-4">
              <Invoice 
                order={showInvoice} 
                branchName={localStorage.getItem('branchName')} 
                billerName={localStorage.getItem('userName')}
              />
              <div className="mt-6 flex gap-3 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print Invoice
                </button>
                <button 
                  onClick={() => setShowInvoice(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      <OrderModal
        isOpen={showOrderModal}
        order={selectedOrder}
        branchId={branchId}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        onUpdate={() => {
          fetchOrders(true);
        }}
      />
    </div>
  );
}
