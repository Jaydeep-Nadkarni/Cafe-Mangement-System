import React, { useState, useEffect } from 'react';
import {
  X, Plus, Minus, Trash2, AlertCircle,
  MessageCircle, Check,
  CreditCard, Banknote, Smartphone, ArrowRightLeft, Users, Ban, Lock
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderModal({ isOpen, order, branchId, onClose, onUpdate }) {
  const [items, setItems] = useState([]);
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    password: '',
    reason: ''
  });

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitType, setSplitType] = useState(null);
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItemsForSplit, setSelectedItemsForSplit] = useState([]);
  const [splitPayments, setSplitPayments] = useState([]);
  const [isSplit, setIsSplit] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [openItemForm, setOpenItemForm] = useState({
    name: '',
    price: '',
    gstApplicable: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load branch settings
  useEffect(() => {
    if (isOpen && branchId) {
      fetchBranchProfile();
    }
  }, [isOpen, branchId]);

  // Set items and customer info when order changes
  useEffect(() => {
    if (order) {
      const mappedItems = (order.items || []).map(item => ({
        ...item,
        name: item.name || item.menuItem?.name || 'Unnamed Item',
        price: item.price || 0,
        quantity: item.quantity || 1,
        gstRate: item.gstRate || 0
      }));
      setItems(mappedItems);
      setCustomerInfo({
        name: order.customerName || order.customerDetails?.name || '',
        phone: order.customerPhone || order.customerDetails?.phone || ''
      });
    }
  }, [order]);

  const fetchBranchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/branch/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCgstRate(res.data.cgstRate || 2.5);
      setSgstRate(res.data.sgstRate || 2.5);
    } catch (err) {
      console.error('Error fetching branch profile:', err);
    }
  };

  const handleUpdateQuantity = (index, delta) => {
    const updatedItems = [...items];
    const newQty = updatedItems[index].quantity + delta;
    if (newQty > 0) {
      updatedItems[index].quantity = newQty;
      setItems(updatedItems);
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddOpenItem = () => {
    if (!openItemForm.name || !openItemForm.price) {
      setError('Item name and price are required');
      return;
    }

    const gstRate = openItemForm.gstApplicable ? 5 : 0;
    const newItem = {
      name: openItemForm.name,
      quantity: 1,
      price: parseFloat(openItemForm.price),
      gstRate: gstRate,
      isOpenItem: true
    };

    setItems([...items, newItem]);
    setOpenItemForm({ name: '', price: '', gstApplicable: false });
    setShowAddItemModal(false);
    setError('');
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const taxRate = cgstRate + sgstRate;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      taxRate: taxRate.toFixed(0),
      total: total.toFixed(2)
    };
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      setError('Order must have at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const totals = calculateTotals();

      const updateData = {
        items: items,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        subtotal: parseFloat(totals.subtotal),
        tax: parseFloat(totals.tax),
        total: parseFloat(totals.total)
      };

      await axios.put(
        `${API_URL}/api/orders/${order._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const totals = calculateTotals();
      
      // Save order first
      await handleSaveOrder();

      const payload = {
        paymentMethod: isSplit ? 'mixed' : paymentMethod,
        amountPaid: parseFloat(totals.total),
        isSplit,
        splitPayments: splitPayments.map(({ method, amount }) => ({ method, amount }))
      };

      await axios.post(
        `${API_URL}/api/orders/${order._id}/checkout`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelForm.password || !cancelForm.reason) {
      setError('Password and reason are required for cancellation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/orders/${order._id}/cancel`,
        {
          password: cancelForm.password,
          reason: cancelForm.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  };

  const handleSplitEqual = () => {
    const totals = calculateTotals();
    const amountPerPerson = Math.round(parseFloat(totals.total) / splitCount);
    
    setSplitType('equal');
    setShowSplitModal(false);
    setIsSplit(true);
    setSplitPayments([{ method: paymentMethod, amount: amountPerPerson, id: Date.now() }]);
  };

  const handleSplitByItems = () => {
    if (selectedItemsForSplit.length === 0) {
      setError('Please select at least one item');
      return;
    }
    
    const totals = calculateTotals();
    const selectedSubtotal = selectedItemsForSplit.reduce((sum, idx) => sum + (items[idx].price * items[idx].quantity), 0);
    const ratio = parseFloat(totals.subtotal) > 0 ? selectedSubtotal / parseFloat(totals.subtotal) : 0;
    const tax = parseFloat(totals.tax) * ratio;
    const finalTotal = Math.round(selectedSubtotal + tax);

    setSplitType('item');
    setShowSplitModal(false);
    setIsSplit(true);
    setSplitPayments([{ method: paymentMethod, amount: finalTotal, id: Date.now() }]);
  };

  const handleAddPaymentMethod = (method, amount) => {
    const currentTotal = parseFloat(calculateTotals().total);
    const alreadyPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = currentTotal - alreadyPaid;

    if (amount > remaining) amount = remaining;
    if (amount <= 0) return;

    setSplitPayments([...splitPayments, { method, amount, id: Date.now() }]);
    setIsSplit(true);
  };

  const handleRemovePayment = (id) => {
    const updated = splitPayments.filter(p => p.id !== id);
    setSplitPayments(updated);
    if (updated.length === 0) setIsSplit(false);
  };

  if (!isOpen || !order) return null;

  const totals = calculateTotals();
  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = parseFloat(totals.total) - totalPaid;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">
        
        {/* Left Side - Order Items */}
        <div className="flex-1 flex flex-col border-r border-gray-100">
          {/* Left Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : 'Counter'} • {itemCount} Items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.quantity}x {item.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(index, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(index, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>

        {/* Right Side - Bill Summary */}
        <div className="w-96 flex flex-col bg-gray-50">
          {/* Right Header */}
          <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Bill Summary</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Customer</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{customerInfo.name || 'Walk-in'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{customerInfo.phone || 'No phone'}</p>
                </div>
                <button className="p-2 hover:bg-white rounded-lg text-emerald-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bill Calculation */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax ({totals.taxRate}%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.tax)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-gray-900">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4 bg-white border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'upi', label: 'UPI', icon: Smartphone }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <method.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">{method.label}</span>
                </button>
              ))}
            </div>

            {/* Cash Received */}
            {paymentMethod === 'cash' && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Cash Received</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
                {cashReceived && parseFloat(cashReceived) >= parseFloat(totals.total) && (
                  <p className="mt-2 text-sm text-emerald-600 font-medium">
                    Change: {formatCurrency(parseFloat(cashReceived) - parseFloat(totals.total))}
                  </p>
                )}
              </div>
            )}

            {/* Split Payments Display */}
            {splitPayments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Split Payments</p>
                {splitPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">{p.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{formatCurrency(p.amount)}</span>
                      <button onClick={() => handleRemovePayment(p.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {remaining > 0.01 && (
                  <p className="text-sm text-amber-600 font-medium">
                    Remaining: {formatCurrency(remaining)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Complete Payment Button */}
          <div className="p-4 bg-white border-t border-gray-100">
            <button
              onClick={handleCheckout}
              disabled={loading || (isSplit && remaining > 0.01)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {loading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Custom Item</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={openItemForm.name}
                  onChange={e => setOpenItemForm({ ...openItemForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="e.g., Special Dish"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={openItemForm.price}
                    onChange={e => setOpenItemForm({ ...openItemForm, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openItemForm.gstApplicable}
                  onChange={e => setOpenItemForm({ ...openItemForm, gstApplicable: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Apply 5% GST</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOpenItem}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Split Bill</h3>
              <button onClick={() => setShowSplitModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSplitType('equal')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    splitType === 'equal' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <Users className="w-6 h-6 text-gray-600" />
                  <span className="font-bold text-sm">Equal Split</span>
                </button>
                <button
                  onClick={() => setSplitType('item')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    splitType === 'item' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <ArrowRightLeft className="w-6 h-6 text-gray-600" />
                  <span className="font-bold text-sm">By Items</span>
                </button>
              </div>

              {splitType === 'equal' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Number of People</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                        className="w-8 h-8 bg-gray-100 rounded-lg font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{splitCount}</span>
                      <button
                        onClick={() => setSplitCount(splitCount + 1)}
                        className="w-8 h-8 bg-gray-100 rounded-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-sm text-emerald-700">Per person</span>
                      <span className="font-bold text-emerald-800">
                        {formatCurrency(parseFloat(totals.total) / splitCount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {splitType === 'item' && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item, idx) => {
                    const isSelected = selectedItemsForSplit.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedItemsForSplit(selectedItemsForSplit.filter(i => i !== idx));
                          } else {
                            setSelectedItemsForSplit([...selectedItemsForSplit, idx]);
                          }
                        }}
                        className={`w-full flex justify-between items-center p-3 rounded-xl border-2 ${
                          isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                        }`}
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={splitType === 'equal' ? handleSplitEqual : handleSplitByItems}
                  disabled={!splitType}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-red-600 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Cancel Order</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={cancelForm.reason}
                  onChange={e => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  rows="3"
                  placeholder="Why is this order being cancelled?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={cancelForm.password}
                    onChange={e => setCancelForm({ ...cancelForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelForm({ password: '', reason: '' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={loading || !cancelForm.password || !cancelForm.reason}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
