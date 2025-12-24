import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, AlertCircle, Package,
  Coffee, Droplet, DollarSign, FileText, ChevronDown,
  User, Phone, Hash, Star, Tag, Gift, Ban, Lock,
  CreditCard, Banknote, Smartphone, ArrowRightLeft, Users, Check
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

// Quick-add items for packed items section
const QUICK_ADD_ITEMS = [
  { name: 'Water Bottle', price: 30, gst: 0 },
  { name: 'Coke 250ml', price: 50, gst: 5 },
  { name: 'Sprite 250ml', price: 50, gst: 5 },
  { name: 'Coffee', price: 80, gst: 5 },
  { name: 'Tea', price: 40, gst: 5 },
  { name: 'Juice', price: 60, gst: 5 }
];

export default function OrderModal({ isOpen, order, branchId, onClose, onUpdate }) {
  const [items, setItems] = useState([]);
  const [branchGST, setBranchGST] = useState('');
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    gstn: '',
    isFavorite: false,
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  
  const [discount, setDiscount] = useState(0);
  const [isComplementary, setIsComplementary] = useState(false);
  const [complementaryReason, setComplementaryReason] = useState('');
  
  const [showOpenItemModal, setShowOpenItemModal] = useState(false);
  const [openItemForm, setOpenItemForm] = useState({
    name: '',
    price: '',
    gstApplicable: false,
    description: ''
  });
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    password: '',
    reason: ''
  });

  // Payment & Split State
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitPayments, setSplitPayments] = useState([]);
  const [isSplit, setIsSplit] = useState(false);
  const [splitType, setSplitType] = useState(null); // 'equal' or 'item'
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItemsForSplit, setSelectedItemsForSplit] = useState([]);
  const [showSplitModal, setShowSplitModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedPacked, setExpandedPacked] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load branch GST number and rates
  useEffect(() => {
    if (isOpen && branchId) {
      fetchBranchProfile();
    }
  }, [isOpen, branchId]);

  // Set items and customer info when order changes
  useEffect(() => {
    if (order) {
      // Map items to ensure they have proper names
      const mappedItems = (order.items || []).map(item => ({
        ...item,
        name: item.name || item.menuItem?.name || 'Unnamed Item',
        price: item.price || 0,
        quantity: item.quantity || 1,
        gstRate: item.gstRate || 0,
        description: item.description || item.specialInstructions || ''
      }));
      setItems(mappedItems);
      setCustomerInfo({
        name: order.customerName || '',
        phone: order.customerPhone || '',
        gstn: order.customerGSTN || order.taxNumber || '',
        isFavorite: order.isFavorite || false,
        tags: order.tags || []
      });
      setDiscount(order.discount || 0);
      setIsComplementary(order.isComplementary || false);
      setComplementaryReason(order.complementaryReason || '');
    }
  }, [order]);

  const fetchBranchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/branch/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranchGST(res.data.gstNumber || '');
      setCgstRate(res.data.cgstRate || 2.5);
      setSgstRate(res.data.sgstRate || 2.5);
    } catch (err) {
      console.error('Error fetching branch profile:', err);
    }
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
      description: openItemForm.description || '',
      isOpenItem: true
    };

    setItems([...items, newItem]);
    setOpenItemForm({ name: '', price: '', gstApplicable: false, description: '' });
    setShowOpenItemModal(false);
    setError('');
  };

  const handleAddQuickItem = (quickItem) => {
    const newItem = {
      name: quickItem.name,
      quantity: 1,
      price: quickItem.price,
      gstRate: quickItem.gst,
      isOpenItem: true,
      isPacked: true
    };
    setItems([...items, newItem]);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    const updatedItems = [...items];
    if (newQuantity > 0) {
      updatedItems[index].quantity = newQuantity;
    } else {
      updatedItems.splice(index, 1);
    }
    setItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const cgst = subtotal * (cgstRate / 100);
    const sgst = subtotal * (sgstRate / 100);
    const tax = cgst + sgst;
    
    let total = subtotal + tax - discount;
    
    if (isComplementary) {
      total = 0;
    }

    const roundedTotal = Math.round(total);
    const roundOff = roundedTotal - total;

    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      roundOff: roundOff.toFixed(2),
      total: roundedTotal.toFixed(2)
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
        customerGSTN: customerInfo.gstn,
        taxNumber: customerInfo.gstn, // Sync with legacy field
        isFavorite: customerInfo.isFavorite,
        tags: customerInfo.tags,
        discount: parseFloat(totals.discount),
        isComplementary: isComplementary,
        complementaryAmount: isComplementary ? parseFloat(totals.subtotal) + parseFloat(totals.tax) : 0,
        complementaryReason: complementaryReason,
        subtotal: parseFloat(totals.subtotal),
        tax: parseFloat(totals.tax),
        cgst: parseFloat(totals.cgst),
        sgst: parseFloat(totals.sgst),
        cgstRate: cgstRate,
        sgstRate: sgstRate,
        roundOff: parseFloat(totals.roundOff),
        total: parseFloat(totals.total)
      };

      await axios.put(
        `${API_URL}/api/orders/${order._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order');
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

      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !customerInfo.tags.includes(newTag)) {
      setCustomerInfo({
        ...customerInfo,
        tags: [...customerInfo.tags, newTag]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setCustomerInfo({
      ...customerInfo,
      tags: customerInfo.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddPaymentMethod = (method, amount) => {
    const currentTotal = calculateTotals().total;
    const alreadyPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = currentTotal - alreadyPaid;

    if (amount > remaining) {
      amount = remaining;
    }

    if (amount <= 0) return;

    setSplitPayments([...splitPayments, { method, amount, id: Date.now() }]);
    setIsSplit(true);
  };

  const handleRemovePayment = (id) => {
    const updated = splitPayments.filter(p => p.id !== id);
    setSplitPayments(updated);
    if (updated.length === 0) setIsSplit(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const totals = calculateTotals();
      
      const payload = {
        paymentMethod: isSplit ? 'mixed' : paymentMethod,
        amountPaid: parseFloat(totals.total),
        isSplit,
        splitType,
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

  const handleSplitEqual = () => {
    const totals = calculateTotals();
    const amountPerPerson = Math.round(parseFloat(totals.total) / splitCount);
    
    setSplitType('equal');
    setShowSplitModal(false);
    setShowPaymentSection(true);
    setIsSplit(true);
    
    // Add first person's payment
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
    const discount = parseFloat(totals.discount) * ratio;
    const finalTotal = Math.round(selectedSubtotal + tax - discount);

    setSplitType('item');
    setShowSplitModal(false);
    setShowPaymentSection(true);
    setIsSplit(true);
    
    // Add payment for selected items
    setSplitPayments([{ method: paymentMethod, amount: finalTotal, id: Date.now() }]);
  };

  if (!isOpen || !order) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Order {order.orderNumber}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : 'Counter Order'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* GST Number Display */}
          {branchGST && (
            <div className="bg-blue-500/30 rounded px-3 py-2 text-sm">
              <p className="text-blue-100">GST No: <span className="font-mono text-white">{branchGST}</span></p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Section */}
          <div className="mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer Details
              </h3>
              <button
                onClick={() => setCustomerInfo({ ...customerInfo, isFavorite: !customerInfo.isFavorite })}
                className={`p-2 rounded-lg transition-colors ${customerInfo.isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Star className={`w-5 h-5 ${customerInfo.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Customer Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GST Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerInfo.gstn}
                    onChange={e => setCustomerInfo({ ...customerInfo, gstn: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Customer GSTIN"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {customerInfo.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Add tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in order</p>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(item.price)} x {item.quantity}
                          </span>
                          {item.gstRate > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {item.gstRate}% GST
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 mt-2">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-12 text-center border border-gray-300 rounded py-1"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Packed Items Section */}
          <div className="mb-8 border-t pt-6">
            <button
              onClick={() => setExpandedPacked(!expandedPacked)}
              className="flex items-center justify-between w-full mb-4 hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Packed Items</h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${expandedPacked ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedPacked && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUICK_ADD_ITEMS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddQuickItem(item)}
                    className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
                  >
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatCurrency(item.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discount & Complementary Section */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Offers & Adjustments
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={isComplementary}
                    onChange={e => setIsComplementary(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                  />
                  <span className="text-sm font-bold text-gray-700">Mark as Complementary</span>
                </label>
              </div>
              
              {isComplementary && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complementary Reason</label>
                  <textarea
                    value={complementaryReason}
                    onChange={e => setComplementaryReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                    rows="2"
                    placeholder="Why is this order complementary?"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Open Item Modal */}
          {showOpenItemModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add Custom Item</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={openItemForm.name}
                      onChange={e => setOpenItemForm({ ...openItemForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., Biryani"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={openItemForm.price}
                        onChange={e => setOpenItemForm({ ...openItemForm, price: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={openItemForm.gstApplicable}
                        onChange={e => setOpenItemForm({ ...openItemForm, gstApplicable: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Apply 5% GST</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      value={openItemForm.description}
                      onChange={e => setOpenItemForm({ ...openItemForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows="2"
                      placeholder="Special instructions or notes"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowOpenItemModal(false);
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddOpenItem}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bill Summary */}
        <div className="border-t bg-gray-50 p-6 rounded-b-lg">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>CGST ({cgstRate}%):</span>
              <span className="font-medium">{formatCurrency(totals.cgst)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>SGST ({sgstRate}%):</span>
              <span className="font-medium">{formatCurrency(totals.sgst)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Discount:</span>
              <span className="font-medium text-red-600">-{formatCurrency(totals.discount)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Round-off:</span>
              <span className="font-medium">{formatCurrency(totals.roundOff)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200 col-span-2">
              <span>Total Payable:</span>
              <span className={isComplementary ? 'line-through text-gray-400' : 'text-blue-600'}>
                {formatCurrency(totals.total)}
              </span>
            </div>
            {isComplementary && (
              <div className="flex justify-between text-lg font-black text-emerald-600 col-span-2">
                <span>Complementary:</span>
                <span>{formatCurrency(0)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-all"
            >
              <Ban className="w-5 h-5" />
              Cancel
            </button>

            <button
              onClick={() => setShowSplitModal(true)}
              className="px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 flex items-center justify-center gap-2 transition-all"
            >
              <Users className="w-5 h-5" />
              Split Bill
            </button>
            
            <div className="flex-1 flex gap-3">
              <button
                onClick={() => setShowOpenItemModal(true)}
                className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
              <button
                onClick={() => setShowPaymentSection(!showPaymentSection)}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${showPaymentSection ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
              >
                <CreditCard className="w-5 h-5" />
                {showPaymentSection ? 'Hide Payment' : 'Checkout'}
              </button>
            </div>
          </div>

          {/* Payment Section */}
          {showPaymentSection && (
            <div className="mt-6 p-6 bg-white border-2 border-blue-100 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-black text-slate-800">Payment Details</h4>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Remaining</p>
                  <p className="text-xl font-black text-blue-600">
                    {formatCurrency(parseFloat(totals.total) - splitPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
                  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'blue' },
                  { id: 'card', label: 'Card', icon: CreditCard, color: 'purple' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (isSplit) {
                        const remaining = parseFloat(totals.total) - splitPayments.reduce((sum, p) => sum + p.amount, 0);
                        if (remaining > 0) handleAddPaymentMethod(method.id, remaining);
                      } else {
                        setPaymentMethod(method.id);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      (!isSplit && paymentMethod === method.id)
                        ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                        : 'border-slate-100 hover:border-slate-200 text-slate-500'
                    }`}
                  >
                    <method.icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-black uppercase tracking-wider">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Split Payments List */}
              {splitPayments.length > 0 && (
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Split Breakdown</p>
                  {splitPayments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {p.method === 'cash' && <Banknote className="w-4 h-4 text-emerald-600" />}
                          {p.method === 'upi' && <Smartphone className="w-4 h-4 text-blue-600" />}
                          {p.method === 'card' && <CreditCard className="w-4 h-4 text-purple-600" />}
                        </div>
                        <span className="text-sm font-bold text-slate-700 capitalize">{p.method}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-800">{formatCurrency(p.amount)}</span>
                        <button onClick={() => handleRemovePayment(p.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsSplit(!isSplit);
                    setSplitPayments([]);
                  }}
                  className={`px-6 py-4 rounded-xl font-black text-sm transition-all ${isSplit ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {isSplit ? 'Cancel Split' : 'Add Split Payment'}
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading || (parseFloat(totals.total) - splitPayments.reduce((sum, p) => sum + p.amount, 0)) > 0.01}
                  className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                  {loading ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Split Bill Modal */}
        {showSplitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800">Split Bill</h3>
                <button onClick={() => setShowSplitModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSplitType('equal')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${splitType === 'equal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Users className="w-8 h-8" />
                    <span className="font-black text-sm uppercase">Equal Split</span>
                  </button>
                  <button
                    onClick={() => setSplitType('item')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${splitType === 'item' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <ArrowRightLeft className="w-8 h-8" />
                    <span className="font-black text-sm uppercase">By Items</span>
                  </button>
                </div>

                {splitType === 'equal' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Number of People</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-600">-</button>
                      <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl font-black text-slate-800 border-2 border-slate-100">{splitCount}</div>
                      <button onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-600">+</button>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-700">Amount per person</span>
                        <span className="text-lg font-black text-blue-800">{formatCurrency(parseFloat(totals.total) / splitCount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {splitType === 'item' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Items for this Bill</label>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
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
                            className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{item.name || item.menuItem?.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedItemsForSplit.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-700">Selected Total</span>
                          <span className="text-lg font-black text-blue-800">
                            {formatCurrency(selectedItemsForSplit.reduce((sum, idx) => sum + (items[idx].price * items[idx].quantity), 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSplitModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={splitType === 'equal' ? handleSplitEqual : handleSplitByItems}
                    disabled={!splitType}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    Confirm Split
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600 mb-6">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Ban className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black">Cancel Order</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cancellation Reason</label>
                  <textarea
                    required
                    value={cancelForm.reason}
                    onChange={e => setCancelForm({ ...cancelForm, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none text-sm resize-none"
                    rows="3"
                    placeholder="Why is this order being cancelled?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Admin Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="password"
                      value={cancelForm.password}
                      onChange={e => setCancelForm({ ...cancelForm, password: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelForm({ password: '', reason: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={loading || !cancelForm.password || !cancelForm.reason}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    {loading ? 'Processing...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
