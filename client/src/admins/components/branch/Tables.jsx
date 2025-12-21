import React, { useState, useEffect } from 'react';
import { Plus, Users, MapPin, Edit2, Trash2, X, Check, AlertCircle, FileText, Clock, Printer, ArrowRightLeft } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';
import ConfirmationModal from './ConfirmationModal';

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

export default function Tables({ tables, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: 'indoor',
    notes: '',
    currentOccupancy: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      capacity: '',
      location: 'indoor',
      notes: '',
      currentOccupancy: 0
    });
    setEditingTable(null);
  };

  const handleEdit = (e, table) => {
    e.stopPropagation();
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      notes: table.notes || '',
      currentOccupancy: table.currentOccupancy || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setModalState({
      isOpen: true,
      title: 'Delete Table',
      description: 'Are you sure you want to delete this table? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/branch/tables/${id}`);
          onRefresh();
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Failed to delete table:', error);
          setModalState({
            isOpen: true,
            title: 'Error',
            description: 'Failed to delete table. Please try again.',
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        }
      }
    });
  };

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation();
    const confirmMessages = {
      'maintenance': 'Mark this table for maintenance?',
      'available': 'Mark this table as available?',
      'occupied': 'Mark this table as occupied?',
      'reserved': 'Mark this table as reserved?',
      'paid': 'Mark this table as paid?'
    };

    const isDangerous = newStatus === 'maintenance';

    setModalState({
      isOpen: true,
      title: 'Change Table Status',
      description: confirmMessages[newStatus] || 'Change table status?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDangerous: isDangerous,
      onConfirm: async () => {
        try {
          await axios.put(`${API_URL}/api/branch/tables/${id}/status`, { status: newStatus });
          onRefresh();
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Failed to update status:', error);
          setModalState({
            isOpen: true,
            title: 'Error',
            description: 'Failed to update status. Please try again.',
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTable) {
        await axios.put(`${API_URL}/api/branch/tables/${editingTable._id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/branch/tables`, formData);
      }
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to save table:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to save table details. Please try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 text-red-700 border-red-200';
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'reserved': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'maintenance': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'paid': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCardColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-white border-red-500 shadow-sm hover:shadow-md';
      case 'available': return 'bg-white border-green-500 shadow-sm hover:shadow-md';
      case 'reserved': return 'bg-white border-amber-500 shadow-sm hover:shadow-md';
      case 'maintenance': return 'bg-gray-50 border-gray-300 shadow-inner';
      case 'paid': return 'bg-white border-blue-500 shadow-sm hover:shadow-md';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusIndicator = (status) => {
    const colors = {
      occupied: 'bg-red-500',
      available: 'bg-green-500',
      reserved: 'bg-amber-500',
      maintenance: 'bg-gray-400',
      paid: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-300';
  };

  // Calculate stats for multiple orders
  const getTableOrderStats = (table) => {
    if (!table.currentOrders || table.currentOrders.length === 0) {
      return { count: 0, unpaidAmount: 0, totalAmount: 0 };
    }

    const unpaidOrders = table.currentOrders.filter(order => order.paymentStatus === 'unpaid');
    const unpaidAmount = unpaidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalAmount = table.currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      count: table.currentOrders.length,
      unpaidAmount,
      totalAmount
    };
  };

  return (
    <div className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
          <p className="text-gray-500">View and manage restaurant tables</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
        >
          <Plus className="w-5 h-5" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => {
          const orderStats = getTableOrderStats(table);
          // Calculate last activity
          const lastActivity = table.currentOrders?.length > 0
            ? table.currentOrders.reduce((latest, order) => {
              const orderDate = new Date(order.updatedAt || order.createdAt);
              return orderDate > latest ? orderDate : latest;
            }, new Date(table.updatedAt))
            : new Date(table.updatedAt);

          const isOccupied = table.status === 'occupied' || table.status === 'paid';

          return (
            <div
              key={table._id}
              onClick={() => setSelectedTable(table)}
              className={`relative p-3 rounded-lg border-l-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-35 ${getCardColor(table.status)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-bold text-gray-800">
                  {table.tableNumber}
                </span>
                <div className={`w-3 h-3 rounded-full ${getStatusIndicator(table.status)}`} title={table.status}></div>
              </div>

              {/* Middle Content */}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity}</span>
                  <span className="mx-1">•</span>
                  <span className="capitalize">{table.location}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {getTimeSince(lastActivity)}
                </div>
              </div>

              {/* Bottom: Financials */}
              {isOccupied && orderStats.count > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 text-right">
                  <div className="text-xs font-medium text-gray-500">
                    {orderStats.unpaidAmount > 0 ? 'Unpaid' : 'Total'}
                  </div>
                  <div className={`font-bold ${orderStats.unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(orderStats.unpaidAmount > 0 ? orderStats.unpaidAmount : orderStats.totalAmount)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedTable(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Table {selectedTable.tableNumber}</h2>
                <span className={`w-3 h-3 rounded-full ${getStatusIndicator(selectedTable.status)}`}></span>
                <span className="text-sm text-gray-500 capitalize">{selectedTable.status}</span>
              </div>
              <button onClick={() => setSelectedTable(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Main Actions */}
                <button className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
                  <FileText className="w-4 h-4" /> View Order
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">
                  <ArrowRightLeft className="w-4 h-4" /> Merge Table
                </button>
                <button
                  onClick={(e) => {
                    handleEdit(e, selectedTable);
                    setSelectedTable(null);
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  <Edit2 className="w-4 h-4" /> Edit Details
                </button>
                <button
                  onClick={(e) => {
                    handleDelete(e, selectedTable._id);
                    setSelectedTable(null);
                  }}
                  className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Set Status</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['available', 'occupied', 'reserved', 'maintenance'].map(status => (
                    <button
                      key={status}
                      disabled={selectedTable.status === status}
                      onClick={(e) => {
                        handleStatusChange(e, selectedTable._id, status);
                        setSelectedTable(null);
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-lg capitalize border ${selectedTable.status === status
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Order Summary (if any) */}
              {selectedTable.currentOrders && selectedTable.currentOrders.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Active Session</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {/* Summary details */}
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Orders</span>
                      <span className="font-medium">{selectedTable.currentOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Unpaid Balance</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(
                          selectedTable.currentOrders.reduce((sum, o) => sum + (o.paymentStatus !== 'paid' ? o.total : 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                  <input
                    required
                    type="number"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    required
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="counter">Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Near window, Reserved for VIP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Table
                    </>
                  )}
                </button>
              </div>
            </form>
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
    </div>
  );
}
