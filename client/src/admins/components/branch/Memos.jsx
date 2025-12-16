import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, X, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function Memos({ branch }) {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMemo, setNewMemo] = useState({ title: '', content: '', priority: 'medium' });

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${API_URL}/api/branch/memos`);
      setMemos(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching memos:', error);
      setLoading(false);
    }
  };

  const createMemo = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/branch/memos`, newMemo);
      setMemos([res.data, ...memos]);
      setShowModal(false);
      setNewMemo({ title: '', content: '', priority: 'normal' });
    } catch (error) {
      console.error('Error creating memo:', error);
    }
  };

  const deleteMemo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memo?')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.delete(`${API_URL}/api/branch/memos/${id}`);
      setMemos(memos.filter(m => m._id !== id));
    } catch (error) {
      console.error('Error deleting memo:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'low': return 'bg-green-100 border-green-200 text-green-800';
      default: return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }
  };

  if (loading) return <div className="p-4">Loading memos...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Memos</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Memo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
        {memos.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">
            <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No memos found. Create one to communicate with staff.</p>
          </div>
        ) : (
          memos.map(memo => (
            <div 
              key={memo._id} 
              className={`p-4 rounded-lg border shadow-sm relative group ${getPriorityColor(memo.priority)}`}
            >
              <button 
                onClick={() => deleteMemo(memo._id)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-lg mb-2 pr-6">{memo.title}</h3>
              <p className="whitespace-pre-wrap text-sm mb-4">{memo.content}</p>
              <div className="text-xs opacity-75 flex justify-between items-center mt-auto">
                <span>{new Date(memo.createdAt).toLocaleDateString()}</span>
                <span className="uppercase font-bold text-[10px] tracking-wider border px-1 rounded">
                  {memo.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Memo Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Memo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={createMemo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={newMemo.title}
                  onChange={e => setNewMemo({...newMemo, title: e.target.value})}
                  placeholder="e.g., Staff Meeting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={newMemo.priority}
                  onChange={e => setNewMemo({...newMemo, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows="4"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={newMemo.content}
                  onChange={e => setNewMemo({...newMemo, content: e.target.value})}
                  placeholder="Write your message here..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
