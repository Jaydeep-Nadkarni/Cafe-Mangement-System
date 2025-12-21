import React, { useState, useEffect } from 'react';
import { 
  Utensils, Search, Plus, Edit2, Trash2, X, Image as ImageIcon, 
  Check, Copy, Filter, Tag, Settings
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useSocket } from '../../../user/context/SocketContext';
import ConfirmationModal from './ConfirmationModal';

const Drawer = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

const CategoryModal = ({ isOpen, onClose, onSave, editingCategory }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    sortOrder: 0
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color || '#6B7280',
        sortOrder: editingCategory.sortOrder || 0
      });
    } else {
      setFormData({ name: '', color: '#6B7280', sortOrder: 0 });
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Gray', value: '#6B7280' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Green', value: '#10B981' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Sky', value: '#0EA5E9' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Fuchsia', value: '#D946EF' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Rose', value: '#F43F5E' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              placeholder="e.g. Beverages"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({...formData, color: color.value})}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color.value ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input 
              type="number"
              value={formData.sortOrder}
              onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Inventory({ menu, setMenu }) {
  const { socket, joinBranchRoom } = useSocket();
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [useDynamicCategories, setUseDynamicCategories] = useState(true);
  const [branch, setBranch] = useState(null);
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
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isVegetarian: false,
    isVegan: false,
    isSpicy: false,
    sortOrder: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch branch details
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/branch/details`);
        setBranch(res.data);
      } catch (error) {
        console.error('Error fetching branch:', error);
      }
    };
    fetchBranch();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [useDynamicCategories]);
  
  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket || !branch?._id) return;
    
    joinBranchRoom(branch._id);
    
    // Listen for category updates
    socket.on('categories_updated', (data) => {
      console.log('[Inventory] Categories updated:', data);
      fetchCategories();
    });
    
    // Listen for menu item changes
    socket.on('menu_item_added', (data) => {
      console.log('[Inventory] Item added:', data);
      fetchCategories();
    });
    
    socket.on('menu_item_updated', (data) => {
      console.log('[Inventory] Item updated:', data);
      fetchCategories();
    });
    
    socket.on('menu_item_deleted', (data) => {
      console.log('[Inventory] Item deleted:', data);
      fetchCategories();
    });
    
    socket.on('menu_item_availability_changed', (data) => {
      console.log('[Inventory] Item availability changed:', data);
      fetchCategories();
    });
    
    return () => {
      socket.off('categories_updated');
      socket.off('menu_item_added');
      socket.off('menu_item_updated');
      socket.off('menu_item_deleted');
      socket.off('menu_item_availability_changed');
    };
  }, [socket, branch]);

  const fetchCategories = async () => {
    try {
      // Always fetch all categories including empty ones for the manager view
      const endpoint = useDynamicCategories 
        ? `${API_URL}/api/branch/categories/dynamic?includeEmpty=true`
        : `${API_URL}/api/branch/categories`;
      const res = await axios.get(endpoint);
      setCategories(res.data);
      if (res.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: res.data[0].slug }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/api/branch/categories/${editingCategory._id}`, categoryData);
      } else {
        await axios.post(`${API_URL}/api/branch/categories`, categoryData);
      }
      fetchCategories();
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    setModalState({
      isOpen: true,
      title: 'Delete Category',
      description: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/branch/categories/${id}`);
          fetchCategories();
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Failed to delete category:', error);
          setModalState({
            isOpen: true,
            title: 'Error',
            description: 'Failed to delete category. Please try again.',
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0].slug : '',
      image: '',
      isVegetarian: false,
      isVegan: false,
      isSpicy: false,
      sortOrder: 0
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
      isSpicy: item.isSpicy,
      sortOrder: item.sortOrder || 0
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    setModalState({
      isOpen: true,
      title: 'Delete Item',
      description: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/branch/menu/${id}`);
          setMenu(menu.filter(item => item._id !== id));
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Delete error:', error);
          setModalState({
            isOpen: true,
            title: 'Error',
            description: 'Failed to delete item. Please try again.',
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        }
      }
    });
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/api/branch/menu/${id}/duplicate`);
      setMenu([...menu, res.data]);
    } catch (error) {
      console.error('Duplicate error:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to duplicate item. Please try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
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
      setShowDrawer(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to save item details. Please try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
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
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to update item status. Please try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    }
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filteredMenu.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleBulkAction = async (action, value) => {
    setModalState({
      isOpen: true,
      title: 'Bulk Action',
      description: `Apply action to ${selectedItems.length} items?`,
      confirmText: 'Apply',
      cancelText: 'Cancel',
      isDangerous: action === 'delete',
      onConfirm: async () => {
        try {
          await axios.put(`${API_URL}/api/branch/menu/bulk`, {
            items: selectedItems,
            action,
            value
          });
          // Refresh menu
          const res = await axios.get(`${API_URL}/api/branch/menu`);
          setMenu(res.data);
          setSelectedItems([]);
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Bulk action error:', error);
          setModalState({
            isOpen: true,
            title: 'Error',
            description: 'Bulk action failed. Please try again.',
            confirmText: 'OK',
            isDangerous: true,
            onConfirm: null
          });
        }
      }
    });
  };

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1">Manage your menu items, pricing, and availability</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium text-sm"
          >
            <Settings className="w-4 h-4" />
            Manage Categories
          </button>
          <button 
            onClick={() => { resetForm(); setShowDrawer(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 animate-in fade-in slide-in-from-right-4 duration-200">
            <span className="text-xs font-bold text-green-700">{selectedItems.length} selected</span>
            <div className="h-4 w-px bg-green-200 mx-1" />
            <button onClick={() => handleBulkAction('availability', true)} className="text-xs font-medium text-green-700 hover:text-green-800 px-2 py-1 hover:bg-green-100 rounded">Enable</button>
            <button onClick={() => handleBulkAction('availability', false)} className="text-xs font-medium text-amber-700 hover:text-amber-800 px-2 py-1 hover:bg-amber-100 rounded">Disable</button>
            <button onClick={() => handleBulkAction('delete', true)} className="text-xs font-medium text-red-700 hover:text-red-800 px-2 py-1 hover:bg-red-100 rounded">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedItems.length === filteredMenu.length && filteredMenu.length > 0}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="p-4 w-20">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4 w-32">Price</th>
                <th className="p-4 w-32">Category</th>
                <th className="p-4 w-40">Status</th>
                <th className="p-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMenu.map(item => (
                <tr key={item._id} className={`group hover:bg-gray-50/50 transition-colors ${selectedItems.includes(item._id) ? 'bg-green-50/30' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <Utensils className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-600">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="p-4">
                    {(() => {
                      const cat = categories.find(c => c.slug === item.category);
                      return (
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white capitalize"
                          style={{ backgroundColor: cat?.color || '#6B7280' }}
                        >
                          {cat?.name || item.category}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.isAvailable ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDuplicate(item._id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer for Add/Edit */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="url"
                  placeholder="Image URL (https://...)"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <p className="text-xs text-gray-500">Enter a direct link to an image (JPG, PNG)</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input 
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="e.g. Cappuccino"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input 
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  {categories.map(c => (
                    <option key={c._id} value={c.slug}>{c.name}</option>
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                placeholder="Brief description of the item..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input 
                type="number"
                value={formData.sortOrder}
                onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the menu</p>
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Information</label>
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${formData.isVegetarian ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.isVegetarian ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {formData.isVegetarian && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium">Vegetarian</span>
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${formData.isVegan ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="checkbox"
                  checked={formData.isVegan}
                  onChange={e => setFormData({...formData, isVegan: e.target.checked})}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.isVegan ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {formData.isVegan && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium">Vegan</span>
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${formData.isSpicy ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="checkbox"
                  checked={formData.isSpicy}
                  onChange={e => setFormData({...formData, isSpicy: e.target.checked})}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.isSpicy ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                  {formData.isSpicy && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium">Spicy</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-100 flex gap-3">
            <button 
              type="button"
              onClick={() => setShowDrawer(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item')}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Category Management Modal */}
      <CategoryModal 
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
      />

      {/* Category Manager Drawer */}
      <Drawer
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        title="Manage Categories"
      >
        <div className="space-y-4">
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>

          <div className="space-y-2">
            {categories.map(category => (
              <div 
                key={category._id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">Sort: {category.sortOrder}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No categories yet</p>
              <p className="text-sm">Create your first category to get started</p>
            </div>
          )}
        </div>
      </Drawer>

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