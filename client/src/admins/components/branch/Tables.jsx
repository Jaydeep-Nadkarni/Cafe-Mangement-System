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
      case 'occupied': return 'bg-red-50 border-red-100 hover:border-red-200';
      case 'available': return 'bg-green-50 border-green-100 hover:border-green-200';
      case 'reserved': return 'bg-amber-50 border-amber-100 hover:border-amber-200';
      case 'maintenance': return 'bg-gray-50 border-gray-200 hover:border-gray-300';
      case 'paid': return 'bg-blue-50 border-blue-100 hover:border-blue-200';
      default: return 'bg-white border-gray-100';
    }
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

          return (
          <div 
            key={table._id} 
            onClick={() => setSelectedTable(table)}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer group ${getCardColor(table.status)}`}
          >
            {/* Order Count Badge */}
            {orderStats.count > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg z-10">
                {orderStats.count}
              </div>
            )}

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20 backdrop-blur-[2px]">
               <button 
                 onClick={(e) => { e.stopPropagation(); /* handlePrint(table) */ }}
                 className="p-3 bg-white text-gray-800 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-lg"
                 title="Print Bill"
               >
                 <Printer className="w-5 h-5" />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); /* handleMerge(table) */ }}
                 className="p-3 bg-white text-gray-800 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors shadow-lg"
                 title="Merge Table"
               >
                 <ArrowRightLeft className="w-5 h-5" />
               </button>
               <button 
                 onClick={(e) => handleEdit(e, table)} 
                 className="p-3 bg-white text-gray-800 rounded-full hover:bg-amber-50 hover:text-amber-600 transition-colors shadow-lg"
                 title="Edit Table"
               >
                 <Edit2 className="w-5 h-5" />
               </button>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{table.tableNumber}</span>
                {table.notes && (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              {/* Time Since Activity */}
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" />
                {getTimeSince(lastActivity)}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="flex items-center gap-1 font-medium text-gray-600">
                <Users className="w-4 h-4" /> {table.capacity}
              </span>
              <span className="font-medium text-gray-600 capitalize">
                {table.location}
              </span>
            </div>

            {/* Bill Amount Display */}
            {orderStats.totalAmount > 0 && (
              <div className={`mb-3 p-2 rounded-lg border ${orderStats.unpaidAmount > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex justify-between items-end">
                  <div>
                    <div className={`text-xs font-bold uppercase ${orderStats.unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {orderStats.unpaidAmount > 0 ? 'Unpaid' : 'Total'}
                    </div>
                    <div className={`text-lg font-bold ${orderStats.unpaidAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {formatCurrency(orderStats.unpaidAmount > 0 ? orderStats.unpaidAmount : orderStats.totalAmount)}
                    </div>
                  </div>
                  {orderStats.unpaidAmount > 0 && orderStats.totalAmount > orderStats.unpaidAmount && (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-medium uppercase">Total Bill</div>
                      <div className="text-sm font-bold text-gray-600">{formatCurrency(orderStats.totalAmount)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status & Actions */}
            <div className="space-y-2">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-center border ${getStatusColor(table.status)}`}>
                {table.status}
              </div>
              
              {table.status === 'paid' && (
                <button 
                  onClick={(e) => handleStatusChange(e, table._id, 'available')}
                  className="w-full py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Mark Available
                </button>
              )}
              
            </div>
          </div>
        );})}
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedTable(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Table {selectedTable.tableNumber}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    handleEdit(null, selectedTable);
                    setSelectedTable(null);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Table"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedTable(null)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(selectedTable.status)}`}>
                    {selectedTable.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Location</span>
                  <span className="font-medium capitalize">{selectedTable.location}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Capacity</span>
                  <span className="font-medium">{selectedTable.capacity} Seats</span>
                </div>
              </div>

              {/* Notes */}
              {selectedTable.notes && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Notes
                  </h3>
                  <p className="text-sm text-amber-700">{selectedTable.notes}</p>
                </div>
              )}

              {/* Status Change Options */}
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 block">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      handleStatusChange(e, selectedTable._id, 'available');
                      setSelectedTable(null);
                    }}
                    className="py-2 px-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    Available
                  </button>
                  <button
                    onClick={(e) => {
                      handleStatusChange(e, selectedTable._id, 'occupied');
                      setSelectedTable(null);
                    }}
                    className="py-2 px-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    Occupied
                  </button>
                  <button
                    onClick={(e) => {
                      handleStatusChange(e, selectedTable._id, 'reserved');
                      setSelectedTable(null);
                    }}
                    className="py-2 px-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    Reserved
                  </button>
                  <button
                    onClick={(e) => {
                      handleStatusChange(e, selectedTable._id, 'maintenance');
                      setSelectedTable(null);
                    }}
                    className="py-2 px-3 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {/* Active Orders */}
              {selectedTable.currentOrders && selectedTable.currentOrders.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Active Orders ({selectedTable.currentOrders.length})
                    </h3>
                  </div>
                  <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                    {selectedTable.currentOrders.map((order, orderIdx) => (
                      <div key={order._id || orderIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                          <span className="text-xs font-mono font-bold">#{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            order.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="space-y-1 mb-2">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-600">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <div className="text-xs text-gray-400 italic">+ {order.items.length - 3} more...</div>
                            )}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="font-bold text-gray-900 text-sm">Total</span>
                            <span className={`font-bold text-sm ${
                              order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No active order</p>
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
                    onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    required
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
