import React, { useState } from 'react';
import { Plus, Users, MapPin, Edit2, Trash2, X, Check, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';

export default function Tables({ tables, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  
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
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await axios.delete(`${API_URL}/api/branch/tables/${id}`);
      onRefresh();
    } catch (error) {
      alert('Failed to delete table: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await axios.put(`${API_URL}/api/branch/tables/${id}/status`, { status: newStatus });
      onRefresh();
    } catch (error) {
      alert('Failed to update status');
    }
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
      alert('Failed to save table: ' + (error.response?.data?.message || error.message));
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
        {tables.map(table => (
          <div 
            key={table._id} 
            onClick={() => setSelectedTable(table)}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer group ${getCardColor(table.status)}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{table.tableNumber}</span>
                {table.notes && (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleEdit(e, table)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDelete(e, table._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
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
              
              {table.status === 'available' && (
                <button 
                  onClick={(e) => handleStatusChange(e, table._id, 'maintenance')}
                  className="w-full py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 hover:bg-black/5 rounded-lg transition-colors"
                >
                  Set Maintenance
                </button>
              )}

              {table.status === 'maintenance' && (
                <button 
                  onClick={(e) => handleStatusChange(e, table._id, 'available')}
                  className="w-full py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50"
                >
                  End Maintenance
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedTable(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Table {selectedTable.tableNumber}</h2>
              <button onClick={() => setSelectedTable(null)}><X className="w-6 h-6 text-gray-400" /></button>
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
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Occupancy</span>
                  <span className="font-medium">{selectedTable.currentOccupancy || 0} Guests</span>
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

              {/* Active Order */}
              {selectedTable.currentOrder ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Active Order
                    </h3>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                      #{selectedTable.currentOrder.orderNumber}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {selectedTable.currentOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-green-600 text-lg">
                        ${selectedTable.currentOrder.total?.toFixed(2)}
                      </span>
                    </div>
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
    </div>
  );
}
