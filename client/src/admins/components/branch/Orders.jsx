import React, { useState } from 'react';
import { Coffee, XCircle, MessageCircle, Printer, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Orders({ tables, onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      onRefresh();
    } catch (error) {
      alert('Checkout failed');
    }
  };

  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Live Orders</h2>
        <p className="text-gray-500">Manage active table orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.filter(t => t.currentOrder).map(table => (
          <div key={table._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
              <div className="flex items-center">
                <span className="font-bold text-lg text-gray-900">Table {table.tableNumber}</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                  {table.currentOrder.status}
                </span>
              </div>
              <span className="text-sm text-gray-500 font-mono">#{table.currentOrder.orderNumber?.slice(-6)}</span>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 mb-4 min-h-20">
                {table.currentOrder.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <span className="font-bold text-gray-900">{item.quantity}x</span> 
                      {item.menuItem?.name}
                    </span>
                  </div>
                ))}
                {table.currentOrder.items.length > 3 && (
                  <div className="text-xs text-gray-400 italic pl-6">
                    + {table.currentOrder.items.length - 3} more items...
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-lg text-gray-900">₹{table.currentOrder.total.toFixed(2)}</span>
                <button 
                  onClick={() => setSelectedOrder(table.currentOrder)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-200"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {tables.filter(t => t.currentOrder).length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Coffee className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No active orders</p>
            <p className="text-sm">New orders will appear here automatically</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.createdAt).toLocaleTimeString()} • {selectedOrder.items.length} Items
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              {(selectedOrder.customerName || selectedOrder.customerPhone) && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Details</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{selectedOrder.customerName || 'Guest'}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.customerPhone || 'No phone'}</p>
                    </div>
                    {selectedOrder.customerPhone && (
                      <button 
                        onClick={() => handleSendBill(selectedOrder._id, selectedOrder.customerPhone)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Send WhatsApp Bill"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {selectedOrder.chefNotes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Chef Notes</p>
                      <p className="text-sm text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        {selectedOrder.chefNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Items List */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-sm">{item.quantity}x</span> 
                          {item.menuItem?.name}
                        </p>
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 italic mt-1 pl-9">Note: {item.specialInstructions}</p>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (5%)</span>
                  <span>₹{selectedOrder.tax?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => alert('Printing feature requires local print server')}
                >
                  <Printer className="h-5 w-5 mr-2 text-gray-500" />
                  Print Bill
                </button>
                <button 
                  onClick={() => handleCheckout(selectedOrder._id)}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
