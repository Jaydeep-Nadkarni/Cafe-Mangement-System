import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Plus, Minus, Trash2, Star, Tag, 
  FileText, Send, User, Phone, Hash, ShoppingBag,
  Zap, Coffee, Droplets, Utensils
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderManagement({ table, onClose, onRefresh }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Customer State
  const [customerInfo, setCustomerInfo] = useState({
    phone: '',
    name: '',
    taxNumber: '',
    isFavorite: false,
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMenu();
    if (table.currentOrders && table.currentOrders.length > 0) {
      const activeOrder = table.currentOrders[0];
      setOrderItems(activeOrder.items.map(item => ({
        ...item,
        id: item.menuItem?._id || Math.random().toString(),
        name: item.name || item.menuItem?.name
      })));
      setCustomerInfo({
        phone: activeOrder.customerPhone || '',
        name: activeOrder.customerName || '',
        taxNumber: activeOrder.taxNumber || '',
        isFavorite: false, // Will fetch from customer preferences if phone exists
        tags: []
      });
      if (activeOrder.customerPhone) {
        fetchCustomerPreferences(activeOrder.customerPhone);
      }
    }
  }, [table]);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branch/menu`);
      setMenuItems(response.data);
      const cats = ['all', ...new Set(response.data.map(item => item.category))];
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    }
  };

  const fetchCustomerPreferences = async (phone) => {
    try {
      const response = await axios.get(`${API_URL}/api/branch/customers/${phone}`);
      if (response.data) {
        setCustomerInfo(prev => ({
          ...prev,
          name: response.data.name || prev.name,
          isFavorite: response.data.isFavorite || false,
          tags: response.data.tags || []
        }));
      }
    } catch (error) {
      console.log('Customer not found or error fetching preferences');
    }
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const addToOrder = (item) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.menuItem?._id === item._id);
      if (existing) {
        return prev.map(i => i.menuItem?._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        menuItem: item, 
        id: item._id,
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }];
    });
  };

  const addOpenItem = () => {
    const name = prompt('Enter item name:');
    const price = parseFloat(prompt('Enter price:'));
    if (name && !isNaN(price)) {
      setOrderItems(prev => [...prev, {
        id: Math.random().toString(),
        name,
        price,
        quantity: 1,
        isCustom: true
      }]);
    }
  };

  const addQuickItem = (name, price) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.name === name && i.isCustom);
      if (existing) {
        return prev.map(i => i.name === name && i.isCustom ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: Math.random().toString(),
        name,
        price,
        quantity: 1,
        isCustom: true
      }];
    });
  };

  const updateQuantity = (id, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) return;
    setLoading(true);
    try {
      const orderData = {
        tableId: table._id,
        items: orderItems.map(item => ({
          menuItem: item.menuItem?._id || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        customerPhone: customerInfo.phone,
        customerName: customerInfo.name,
        taxNumber: customerInfo.taxNumber,
        total: subtotal // Simplified for now
      };

      if (table.currentOrders && table.currentOrders.length > 0) {
        await axios.put(`${API_URL}/api/orders/${table.currentOrders[0]._id}`, orderData);
      } else {
        await axios.post(`${API_URL}/api/orders`, orderData);
      }

      // Update customer preferences
      if (customerInfo.phone) {
        await axios.post(`${API_URL}/api/branch/customers/preferences`, {
          phone: customerInfo.phone,
          name: customerInfo.name,
          isFavorite: customerInfo.isFavorite,
          tags: customerInfo.tags
        });
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEBill = async () => {
    if (!customerInfo.phone) {
      alert('Please enter customer phone number');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/orders/${table.currentOrders[0]._id}/send-whatsapp-bill`, {
        phone: customerInfo.phone
      });
      alert('E-Bill sent successfully');
    } catch (error) {
      console.error('Failed to send e-bill:', error);
      alert('Failed to send e-bill');
    }
  };

  const addTag = () => {
    if (newTag && !customerInfo.tags.includes(newTag)) {
      setCustomerInfo(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setCustomerInfo(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-[95vh] md:max-w-7xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Table {table.tableNumber}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Menu Selection */}
          <div className="flex-1 flex flex-col border-r border-slate-100 bg-white overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Search & Categories */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-4 rounded-2xl font-black whitespace-nowrap transition-all border-2 ${
                        selectedCategory === cat 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={addOpenItem} className="flex items-center justify-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-2xl font-black hover:bg-amber-100 transition-all border-2 border-amber-100">
                  <Zap className="w-4 h-4" /> Open Item
                </button>
                <button onClick={() => addQuickItem('Water Bottle', 20)} className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl font-black hover:bg-blue-100 transition-all border-2 border-blue-100">
                  <Droplets className="w-4 h-4" /> Water
                </button>
                <button onClick={() => addQuickItem('Tea', 15)} className="flex items-center justify-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-2xl font-black hover:bg-orange-100 transition-all border-2 border-orange-100">
                  <Coffee className="w-4 h-4" /> Tea
                </button>
                <button onClick={() => addQuickItem('Coffee', 25)} className="flex items-center justify-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-2xl font-black hover:bg-rose-100 transition-all border-2 border-rose-100">
                  <Utensils className="w-4 h-4" /> Coffee
                </button>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenu.map(item => (
                  <button
                    key={item._id}
                    onClick={() => addToOrder(item)}
                    className="p-4 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-50/50 transition-all group text-left flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2">{item.name}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{item.category}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-black text-slate-800">{formatCurrency(item.price)}</span>
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Customer Info */}
          <div className="w-full lg:w-[450px] flex flex-col bg-slate-50/50 overflow-hidden">
            {/* Customer Info Section */}
            <div className="p-6 bg-white border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Customer Details</h3>
                <button 
                  onClick={() => setCustomerInfo(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                  className={`p-2 rounded-xl transition-all ${customerInfo.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Star className={`w-5 h-5 ${customerInfo.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel"
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, phone: e.target.value });
                      if (e.target.value.length === 10) fetchCustomerPreferences(e.target.value);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Customer Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm"
                  />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Tax Number (GSTIN)"
                    value={customerInfo.taxNumber}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, taxNumber: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {customerInfo.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none font-bold text-xs"
                  />
                  <button onClick={addTag} className="p-2 bg-slate-800 text-white rounded-xl"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Current Order</h3>
              {orderItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                  <ShoppingBag className="w-12 h-12" />
                  <p className="font-bold">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border-2 border-slate-100 flex items-center justify-between group">
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm">{item.name}</h4>
                        <p className="text-xs font-bold text-emerald-600">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-rose-600">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-black text-slate-800 text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-emerald-600">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-20 text-right font-black text-slate-800 text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Total Amount</span>
                <span className="text-3xl font-black text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleSendEBill}
                  disabled={!customerInfo.phone || orderItems.length === 0}
                  className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" /> E-Bill
                </button>
                <button 
                  onClick={handleSaveOrder}
                  disabled={loading || orderItems.length === 0}
                  className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <FileText className="w-5 h-5" /> Save Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
