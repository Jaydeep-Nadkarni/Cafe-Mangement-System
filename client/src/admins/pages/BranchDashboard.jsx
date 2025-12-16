import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranchSocket } from '../../hooks/useBranchSocket';
import { 
  LogOut, 
  Store, 
  Coffee, 
  Utensils, 
  DollarSign, 
  Printer, 
  MessageCircle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

export default function BranchDashboard() {
  const { user, logout } = useAuth();
  const [branch, setBranch] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders, inventory, tables
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [newTableLocation, setNewTableLocation] = useState('indoor');
  const [creatingTable, setCreatingTable] = useState(false);

  // Fetch Initial Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // 1. Get Branch Details
      const branchRes = await axios.get(`${API_URL}/api/branch/details`);
      setBranch(branchRes.data);

      // 2. Get Tables (with active orders)
      const tablesRes = await axios.get(`${API_URL}/api/branch/tables`);
      setTables(tablesRes.data);

      // 3. Get Menu (for inventory)
      const menuRes = await axios.get(`${API_URL}/api/branch/menu`);
      setMenu(menuRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching branch data:', error);
      setLoading(false);
    }
  };

  // Real-time Updates
  useBranchSocket(branch?._id, {
    onNewOrder: (data) => {
      // Refresh tables to show new order
      fetchData();
      // Optional: Show notification
    },
    onOrderStatusChange: (data) => {
      fetchData();
    },
    onPaymentConfirmation: (data) => {
      fetchData();
      if (selectedOrder && selectedOrder._id === data.orderId) {
        setSelectedOrder(null); // Close modal if open
      }
    },
    onTableMerge: (data) => {
      fetchData();
    }
  });

  // Actions
  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/branch/menu/${itemId}/availability`, {
        isAvailable: !currentStatus
      });
      // Optimistic update
      setMenu(menu.map(item => 
        item._id === itemId ? { ...item, isAvailable: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleCreateTable = async () => {
    try {
      if (!newTableNumber || !newTableCapacity) {
        alert('Please fill in all fields');
        return;
      }

      setCreatingTable(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${API_URL}/api/branch/tables`, {
        tableNumber: parseInt(newTableNumber),
        capacity: parseInt(newTableCapacity),
        location: newTableLocation
      });

      console.log('Table created:', response.data);
      
      // Reset form and close modal
      setNewTableNumber('');
      setNewTableCapacity('');
      setNewTableLocation('indoor');
      setShowCreateTableModal(false);
      
      // Refresh tables list
      fetchData();
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingTable(false);
    }
  };

  const handleSendBill = async (orderId, phoneNumber) => {
    if (!phoneNumber) return alert('Please enter a phone number');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/orders/${orderId}/send-whatsapp-bill`, {
        phoneNumber
      });
      alert('Bill sent successfully!');
    } catch (error) {
      alert('Failed to send bill');
    }
  };

  const handleCheckout = async (orderId) => {
    if (!window.confirm('Confirm payment received?')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/orders/${orderId}/checkout`, {
        paymentMethod: 'cash', // Default to cash for manual checkout
        amountPaid: selectedOrder.total
      });
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      alert('Checkout failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Branch Dashboard...</div>;

  return (
    <div className="min-h-screen bg-bg-cream pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{branch?.name}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <span className={`w-2 h-2 rounded-full mr-2 ${branch?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {branch?.isActive ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 ${
              activeTab === 'orders' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
            }`}
          >
            Live Orders
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 ${
              activeTab === 'inventory' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
            }`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('tables')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 ${
              activeTab === 'tables' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
            }`}
          >
            Tables
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.filter(t => t.currentOrder).map(table => (
              <div key={table._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-bold text-lg text-gray-900">Table {table.tableNumber}</span>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {table.currentOrder.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">#{table.currentOrder.orderNumber}</span>
                </div>
                
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {table.currentOrder.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.menuItem?.name}</span>
                      </div>
                    ))}
                    {table.currentOrder.items.length > 3 && (
                      <div className="text-xs text-gray-400 italic">
                        + {table.currentOrder.items.length - 3} more items...
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="font-bold text-lg">${table.currentOrder.total.toFixed(2)}</span>
                    <button 
                      onClick={() => setSelectedOrder(table.currentOrder)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {tables.filter(t => t.currentOrder).length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Coffee className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active orders</p>
              </div>
            )}
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {menu.map(item => (
                <div key={item._id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${item.isAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
                      <Utensils className={`h-5 w-5 ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.isAvailable ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Manage Tables</h2>
              <button
                onClick={() => setShowCreateTableModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Add Table
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tables.map(table => (
              <div 
                key={table._id} 
                className={`p-6 rounded-xl border-2 text-center ${
                  table.status === 'occupied' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{table.tableNumber}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  table.status === 'occupied' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {table.status === 'occupied' ? 'Occupied' : 'Available'}
                </span>
              </div>
            ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Table</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g., 1, 2, 3..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  placeholder="e.g., 2, 4, 6..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={newTableLocation}
                  onChange={(e) => setNewTableLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="counter">Counter</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateTableModal(false)}
                disabled={creatingTable}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTable}
                disabled={creatingTable}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {creatingTable ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Items List */}
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.quantity}x {item.menuItem?.name}</p>
                      {item.notes && <p className="text-xs text-gray-500 italic">{item.notes}</p>}
                    </div>
                    <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>${selectedOrder.tax?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                  <span>Total</span>
                  <span>${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    const phone = prompt('Enter customer phone number:');
                    if (phone) handleSendBill(selectedOrder._id, phone);
                  }}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                  WhatsApp Bill
                </button>
                <button 
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  onClick={() => alert('Printing feature requires local print server')}
                >
                  <Printer className="h-5 w-5 mr-2 text-gray-600" />
                  Print Bill
                </button>
                <button 
                  onClick={() => handleCheckout(selectedOrder._id)}
                  className="col-span-2 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
