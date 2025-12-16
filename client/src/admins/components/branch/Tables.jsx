import React, { useState } from 'react';
import { Plus, Users, MapPin } from 'lucide-react';
import axios from 'axios';

export default function Tables({ tables, onRefresh }) {
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [newTableLocation, setNewTableLocation] = useState('indoor');
  const [creatingTable, setCreatingTable] = useState(false);

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
      onRefresh();
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingTable(false);
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
          onClick={() => setShowCreateTableModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
        >
          <Plus className="w-5 h-5" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map(table => (
          <div 
            key={table._id} 
            className={`relative p-6 rounded-2xl border-2 text-center transition-all duration-200 hover:shadow-md ${
              table.status === 'occupied' 
                ? 'border-red-100 bg-red-50/50' 
                : 'border-green-100 bg-green-50/50'
            }`}
          >
            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
              table.status === 'occupied' ? 'bg-red-500' : 'bg-green-500'
            }`} />
            
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{table.tableNumber}</h3>
            
            <div className="flex justify-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {table.capacity}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <MapPin className="w-3 h-3" /> {table.location}
              </span>
            </div>

            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              table.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {table.status === 'occupied' ? 'Occupied' : 'Available'}
            </span>
          </div>
        ))}
      </div>

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Add New Table</h2>
            <p className="text-gray-500 mb-6 text-sm">Create a new table for your branch</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Table Number</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g., 1, 2, 3..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  placeholder="e.g., 2, 4, 6..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <div className="grid grid-cols-3 gap-2">
                  {['indoor', 'outdoor', 'counter'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setNewTableLocation(loc)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        newTableLocation === loc
                          ? 'bg-green-600 text-white shadow-md shadow-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowCreateTableModal(false)}
                disabled={creatingTable}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTable}
                disabled={creatingTable}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-green-200"
              >
                {creatingTable ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
