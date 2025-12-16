import React, { useState } from 'react';
import { Utensils, Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Check } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function Inventory({ menu, setMenu }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'coffee',
    image: '',
    isVegetarian: false,
    isVegan: false,
    isSpicy: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const categories = ['coffee', 'tea', 'pastry', 'sandwich', 'dessert', 'beverage', 'snack', 'special'];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'coffee',
      image: '',
      isVegetarian: false,
      isVegan: false,
      isSpicy: false
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image: item.image || '',
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isSpicy: item.isSpicy
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/api/branch/menu/${id}`);
      setMenu(menu.filter(item => item._id !== id));
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        const res = await axios.put(`${API_URL}/api/branch/menu/${editingItem._id}`, formData);
        setMenu(menu.map(item => item._id === editingItem._id ? res.data : item));
      } else {
        const res = await axios.post(`${API_URL}/api/branch/menu`, formData);
        setMenu([...menu, res.data]);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert('Failed to save item: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/api/branch/menu/${itemId}/availability`, {
        isAvailable: !currentStatus
      });
      setMenu(menu.map(item => 
        item._id === itemId ? { ...item, isAvailable: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update item status');
    }
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500">Control menu items and availability</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5">Item Details</div>
          <div className="col-span-2 text-center">Price</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
          {filteredMenu.map(item => (
            <div key={item._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors group">
              <div className="col-span-5 flex items-center">
                <div className="h-10 w-10 rounded-lg bg-gray-100 mr-3 overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <Utensils className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                </div>
              </div>
              <div className="col-span-2 text-center font-mono text-sm text-gray-600">
                {formatCurrency(item.price)}
              </div>
              <div className="col-span-2 text-center">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                  {item.category}
                </span>
              </div>
              <div className="col-span-2 flex justify-center">
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
              <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="w-10 h-10 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={e => setFormData({...formData, isVegan: e.target.checked})}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={e => setFormData({...formData, isSpicy: e.target.checked})}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Spicy</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Item
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
