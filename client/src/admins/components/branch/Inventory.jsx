import React from 'react';
import { Utensils, Search } from 'lucide-react';
import axios from 'axios';

export default function Inventory({ menu, setMenu }) {
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
      alert('Failed to update item status');
    }
  };

  return (
    <div className="h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500">Control menu item availability</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-6">Item Details</div>
          <div className="col-span-2 text-center">Price</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div className="divide-y divide-gray-100">
          {menu.map(item => (
            <div key={item._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
              <div className="col-span-6 flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${item.isAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
                  <Utensils className={`h-5 w-5 ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                </div>
              </div>
              <div className="col-span-2 text-center font-mono text-sm text-gray-600">
                ₹{item.price.toFixed(2)}
              </div>
              <div className="col-span-2 text-center">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                  {item.category}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <button 
                  onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
                    item.isAvailable ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
