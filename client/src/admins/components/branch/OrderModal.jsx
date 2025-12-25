import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Minus, Trash2, AlertCircle,
  MessageCircle, Check, Star, Tag, Percent, Gift, Hash,
  CreditCard, Banknote, Smartphone, ArrowRightLeft, Users, Ban, Lock, Printer, Package
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

// Quick-add packed items
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
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [branchGST, setBranchGST] = useState('');
  const printRef = useRef();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    gstn: '',
    isFavorite: false,
    tags: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'
  const [couponCode, setCouponCode] = useState('');
  const [isComplementary, setIsComplementary] = useState(false);
  const [complementaryReason, setComplementaryReason] = useState('');
  const [showPackedItems, setShowPackedItems] = useState(false);
  
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
    gstApplicable: false,
    description: ''
  });
  
  const [showGSTNField, setShowGSTNField] = useState(false);
  const [showTagsField, setShowTagsField] = useState(false);
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [showComplementaryField, setShowComplementaryField] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load branch settings
  useEffect(() => {
    if (isOpen && branchId) {
      fetchBranchProfile();
      fetchMenuItems();
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
        phone: order.customerPhone || order.customerDetails?.phone || '',
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
      setCgstRate(res.data.cgstRate || 2.5);
      setSgstRate(res.data.sgstRate || 2.5);
      setBranchGST(res.data.gstNumber || '');
    } catch (err) {
      console.error('Error fetching branch profile:', err);
    }
  };
  
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branch/menu`);
      setMenuItems(response.data.filter(item => item.isAvailable));
    } catch (error) {
      console.error('Error fetching menu items:', error);
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
      description: openItemForm.description || '',
      isOpenItem: true
    };

    setItems([...items, newItem]);
    setOpenItemForm({ name: '', price: '', gstApplicable: false, description: '' });
    setShowAddItemModal(false);
    setError('');
  };

  const handleAddPackedItem = (packedItem) => {
    const newItem = {
      name: packedItem.name,
      quantity: 1,
      price: packedItem.price,
      gstRate: packedItem.gst,
      isOpenItem: true,
      isPacked: true
    };
    setItems([...items, newItem]);
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

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const cgst = subtotal * (cgstRate / 100);
    const sgst = subtotal * (sgstRate / 100);
    const tax = cgst + sgst;
    
    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    let total = subtotal + tax - discountAmount;
    
    // If complementary, total is 0 but we track the amount
    const complementaryAmount = isComplementary ? total : 0;
    if (isComplementary) {
      total = 0;
    }

    // Round off
    const roundedTotal = Math.round(total);
    const roundOff = roundedTotal - total;

    return {
      subtotal: subtotal.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      tax: tax.toFixed(2),
      discount: discountAmount.toFixed(2),
      roundOff: roundOff.toFixed(2),
      total: roundedTotal.toFixed(2),
      complementaryAmount: complementaryAmount.toFixed(2)
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
        taxNumber: customerInfo.gstn,
        isFavorite: customerInfo.isFavorite,
        tags: customerInfo.tags,
        discount: parseFloat(totals.discount),
        couponCode: couponCode,
        isComplementary: isComplementary,
        complementaryAmount: parseFloat(totals.complementaryAmount),
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

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !order) return null;

  const totals = calculateTotals();
  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = parseFloat(totals.total) - totalPaid;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill, #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">
        
        {/* Left Side - Order Items */}
        <div className="flex-1 flex flex-col border-r border-gray-100 overflow-hidden">
          {/* Left Header */}
          <div className="p-6 border-b border-gray-100 flex-shrink-0">
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
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-2 transition-colors mb-2"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
            
            {/* Packed Items Toggle */}
            <button
              onClick={() => setShowPackedItems(!showPackedItems)}
              className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Package className="w-4 h-4" />
              {showPackedItems ? 'Hide' : 'Show'} Packed Items
            </button>
            
            {/* Packed Items Grid */}
            {showPackedItems && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {QUICK_ADD_ITEMS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddPackedItem(item)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                  >
                    <p className="font-medium text-xs text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Bill Summary */}
        <div id="printable-bill" className="w-96 flex flex-col bg-gray-50 overflow-hidden">
          {/* Right Header */}
          <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900">Bill Summary</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="p-4 bg-white border-b border-gray-100 flex-shrink-0 overflow-y-auto max-h-[40vh]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Customer</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowGSTNField(!showGSTNField)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showGSTNField ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title="GST Number"
                >
                  <Hash className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowTagsField(!showTagsField)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showTagsField ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title="Tags"
                >
                  <Tag className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDiscountField(!showDiscountField)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showDiscountField ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title="Discount"
                >
                  <Percent className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowComplementaryField(!showComplementaryField)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showComplementaryField ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title="Complementary"
                >
                  <Gift className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCustomerInfo({ ...customerInfo, isFavorite: !customerInfo.isFavorite })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    customerInfo.isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title="Mark as Favorite"
                >
                  <Star className={`w-4 h-4 ${customerInfo.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Name & Phone */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-bold text-gray-900">{customerInfo.name || 'Walk-in Customer'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{customerInfo.phone || 'No phone'}</p>
              </div>

              {/* GSTN Field */}
              {showGSTNField && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3 h-3 text-gray-400" />
                    <label className="text-xs font-medium text-gray-600">GST Number</label>
                  </div>
                  <input
                    type="text"
                    value={customerInfo.gstn}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, gstn: e.target.value })}
                    placeholder="Customer GSTIN"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none"
                  />
                </div>
              )}

              {/* Tags */}
              {showTagsField && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <label className="text-xs font-medium text-gray-600">Tags</label>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {customerInfo.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag..."
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:border-emerald-500 focus:ring-0 outline-none"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Discount */}
              {showDiscountField && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-3 h-3 text-gray-400" />
                    <label className="text-xs font-medium text-gray-600">Discount</label>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-1">
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none"
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none"
                      >
                        <option value="amount">₹</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon"
                      className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Complementary */}
              {showComplementaryField && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isComplementary}
                      onChange={(e) => setIsComplementary(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded"
                    />
                    <Gift className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-700">Mark as Complementary</span>
                  </label>
                  {isComplementary && (
                    <textarea
                      value={complementaryReason}
                      onChange={(e) => setComplementaryReason(e.target.value)}
                      placeholder="Reason for complementary..."
                      className="w-full mt-2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 outline-none resize-none"
                      rows="2"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bill Calculation */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* GST Number Display */}
            {branchGST && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">GST No:</span> <span className="font-mono">{branchGST}</span>
                </p>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>CGST ({cgstRate}%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.cgst)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>SGST ({sgstRate}%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.sgst)}</span>
            </div>
            {parseFloat(totals.discount) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount {couponCode && `(${couponCode})`}</span>
                <span className="font-semibold text-red-600">-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Round-off</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totals.roundOff)}</span>
            </div>
            {isComplementary && (
              <div className="p-2 bg-purple-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700 font-medium">Complementary Amount</span>
                  <span className="font-bold text-purple-800">{formatCurrency(totals.complementaryAmount)}</span>
                </div>
                {complementaryReason && (
                  <p className="text-xs text-purple-600 mt-1">{complementaryReason}</p>
                )}
                {customerInfo.gstn && (
                  <p className="text-xs text-purple-600 mt-1">Customer GSTN: {customerInfo.gstn}</p>
                )}
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className={`text-2xl font-black ${isComplementary ? 'text-purple-600' : 'text-gray-900'}`}>
                  {formatCurrency(totals.total)}
                </span>
              </div>
              {isComplementary && (
                <p className="text-xs text-purple-600 text-right mt-1">No payment required</p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4 bg-white border-t border-gray-100 no-print">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Payment Method</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                  title="Print Bill"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => alert('E-Bill feature coming soon!')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 flex items-center gap-1.5 transition-colors"
                  title="Send E-Bill"
                >
                  <MessageCircle className="w-4 h-4" />
                  E-Bill
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'upi', label: 'UPI', icon: Smartphone }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    if (isSplit) {
                      // Add to split payments
                      const amountInput = prompt(`Enter amount for ${method.label}:`);
                      if (amountInput) {
                        const amount = parseFloat(amountInput);
                        if (amount > 0) {
                          handleAddPaymentMethod(method.id, amount);
                        }
                      }
                    } else {
                      setPaymentMethod(method.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id && !isSplit
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
            {paymentMethod === 'cash' && !isSplit && (
              <div className="mt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Cash Received</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none text-lg font-semibold"
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
              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Split Payments</p>
                {splitPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {p.method === 'cash' && <Banknote className="w-4 h-4 text-gray-500" />}
                      {p.method === 'card' && <CreditCard className="w-4 h-4 text-gray-500" />}
                      {p.method === 'upi' && <Smartphone className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm font-medium text-gray-700 capitalize">{p.method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{formatCurrency(p.amount)}</span>
                      <button onClick={() => handleRemovePayment(p.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {remaining > 0.01 && (
                  <div className="flex justify-between text-sm p-2 bg-amber-50 rounded-lg">
                    <span className="text-amber-700 font-medium">Remaining</span>
                    <span className="text-amber-800 font-bold">{formatCurrency(remaining)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Add Split Payment Button */}
            {!isComplementary && (
              <button
                onClick={() => setIsSplit(!isSplit)}
                className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSplit
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isSplit ? '✓ Split Payment Mode' : '+ Add Split Payment'}
              </button>
            )}
          </div>

          {/* Complete Payment Button */}
          <div className="p-4 bg-white border-t border-gray-100 no-print">
            <button
              onClick={handleCheckout}
              disabled={loading || (isSplit && remaining > 0.01) || isComplementary}
              className={`w-full py-4 ${isComplementary ? 'bg-purple-500 hover:bg-purple-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-xl font-bold text-lg shadow-lg ${isComplementary ? 'shadow-purple-100' : 'shadow-emerald-100'} disabled:opacity-50 transition-all flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {loading ? 'Processing...' : (isComplementary ? 'Save Complementary Order' : 'Complete Payment')}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={openItemForm.description}
                  onChange={e => setOpenItemForm({ ...openItemForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  rows="2"
                  placeholder="Special instructions or notes..."
                />
              </div>

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
      
      {/* Inventory Selection Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Menu Item</h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {menuItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items available</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {menuItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => {
                        handleAddItem({ 
                          menuItem: item._id,
                          name: item.name,
                          price: item.price,
                          gstRate: item.gstRate || 0,
                          quantity: 1
                        });
                        setShowInventoryModal(false);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                    >
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h4 className="font-bold text-gray-900 group-hover:text-emerald-600">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price)}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                          {item.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
