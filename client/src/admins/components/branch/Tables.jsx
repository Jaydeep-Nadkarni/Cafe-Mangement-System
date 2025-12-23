import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users, MapPin, Edit2, Trash2, X, Check, AlertCircle, FileText, Clock, Printer, ArrowRightLeft, Eye, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';
import ConfirmationModal from './ConfirmationModal';
import Invoice from './Invoice';

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
  const [showInvoice, setShowInvoice] = useState(null); // For printing/viewing invoice
  const [moveKOT, setMoveKOT] = useState(false);
  const [floorPlan, setFloorPlan] = useState('Default Layout');

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
    location: 'A/C',
    notes: '',
    currentOccupancy: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      capacity: '',
      location: 'A/C',
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
      location: table.location || 'A/C',
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
      'paid': 'Mark this table as paid?',
      'printed': 'Mark this table as printed?'
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
      case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200'; // Running Table
      case 'available': return 'bg-gray-100 text-gray-700 border-gray-200'; // Blank Table
      case 'reserved': return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Running KOT Table
      case 'maintenance': return 'bg-gray-200 text-gray-700 border-gray-300';
      case 'paid': return 'bg-orange-100 text-orange-700 border-orange-200'; // Paid Table (Beige-ish)
      case 'printed': return 'bg-green-100 text-green-700 border-green-200'; // Printed Table
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCardColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-blue-50 border-blue-200 shadow-sm'; // Running Table
      case 'available': return 'bg-gray-50 border-gray-200 shadow-sm'; // Blank Table
      case 'reserved': return 'bg-yellow-50 border-yellow-200 shadow-sm'; // Running KOT Table
      case 'maintenance': return 'bg-gray-100 border-gray-300 shadow-inner';
      case 'paid': return 'bg-[#FDF5E6] border-[#F5DEB3] shadow-sm'; // Paid Table (Beige)
      case 'printed': return 'bg-green-50 border-green-200 shadow-sm'; // Printed Table
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusIndicator = (status) => {
    const colors = {
      occupied: 'bg-blue-400',
      available: 'bg-gray-300',
      reserved: 'bg-yellow-400',
      maintenance: 'bg-gray-400',
      paid: 'bg-orange-300',
      printed: 'bg-green-400'
    };
    return colors[status] || 'bg-gray-300';
  };

  // Group tables by location
  const groupedTables = useMemo(() => {
    const groups = {
      'A/C': [],
      'Non A/C': [],
      'Bar': []
    };
    
    tables.forEach(table => {
      const loc = table.location || 'A/C';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(table);
    });
    
    return groups;
  }, [tables]);

  const handlePrintInvoice = (e, table) => {
    e.stopPropagation();
    if (table.currentOrders && table.currentOrders.length > 0) {
      setShowInvoice(table.currentOrders[0]); // For now, just the first order
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const handleViewBill = (e, table) => {
    e.stopPropagation();
    if (table.currentOrders && table.currentOrders.length > 0) {
      setShowInvoice(table.currentOrders[0]);
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
    <div className="h-full bg-white p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="flex gap-3">
          <button className="bg-[#B22222] hover:bg-[#8B0000] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Table Reservation
          </button>
          <button className="bg-[#B22222] hover:bg-[#8B0000] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Contactless
          </button>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${moveKOT ? 'bg-blue-500' : 'bg-gray-300'}`}
              onClick={() => setMoveKOT(!moveKOT)}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${moveKOT ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-medium text-gray-600">Move KOT/ Items</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Blank Table</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                <span>Running Table</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-300"></div>
                <span>Printed Table</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-200"></div>
                <span>Paid Table</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Running KOT Table</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs font-bold text-gray-500 uppercase">Floor Plan</span>
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
                  onClick={() => {}}
                >
                  {floorPlan}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Sections */}
      <div className="space-y-12">
        {Object.entries(groupedTables).map(([location, locationTables]) => (
          <div key={location}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">{location}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
              {locationTables.map(table => {
                const isOccupied = table.status !== 'available' && table.status !== 'maintenance';
                const stats = getTableOrderStats(table);
                const firstOrderTime = table.currentOrders?.[0]?.createdAt;
                
                return (
                  <div
                    key={table._id}
                    onClick={() => setSelectedTable(table)}
                    className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 group ${getCardColor(table.status)}`}
                  >
                    {/* Status Indicator Dot */}
                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${getStatusIndicator(table.status)} shadow-sm`}></div>

                    <span className="text-2xl font-bold text-gray-800">
                      {table.tableNumber}
                    </span>
                    
                    {isOccupied && (
                      <>
                        <div className="absolute bottom-2 left-2 flex flex-col">
                          <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {getTimeSince(firstOrderTime)}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[10px] font-bold text-gray-700">
                            {formatCurrency(stats.unpaidAmount)}
                          </span>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                          <button 
                            onClick={(e) => handlePrintInvoice(e, table)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4 text-blue-600" />
                          </button>
                          <button 
                            onClick={(e) => handleViewBill(e, table)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                            title="View Order"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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

      {/* Table Details Modal */}
      {selectedTable && !showInvoice && (
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
                <button 
                  onClick={(e) => handleViewBill(e, selectedTable)}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                >
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
                <div className="grid grid-cols-3 gap-2">
                  {['available', 'occupied', 'reserved', 'maintenance', 'paid', 'printed'].map(status => (
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
                  <option value="A/C">A/C</option>
                  <option value="Non A/C">Non A/C</option>
                  <option value="Bar">Bar</option>
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
