import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, CheckSquare, StickyNote, Plus, Trash2, Edit,
  Store, Calendar, User, CheckCircle, XCircle, Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Memos() {
  const [activeTab, setActiveTab] = useState('memos');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [memos, setMemos] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    branch: '',
    dueDate: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (activeTab === 'memos') fetchMemos();
    else if (activeTab === 'tasks') fetchTasks();
    else if (activeTab === 'notes') fetchNotes();
  }, [activeTab, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchMemos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = selectedBranch === 'all'
        ? `${API_URL}/api/admin/memos`
        : `${API_URL}/api/admin/memos?branch=${selectedBranch}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemos(res.data.memos || res.data || []);
    } catch (error) {
      console.error('Error fetching memos:', error);
      setMemos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Using memos endpoint with type filter for tasks
      const url = selectedBranch === 'all'
        ? `${API_URL}/api/admin/memos?type=task`
        : `${API_URL}/api/admin/memos?branch=${selectedBranch}&type=task`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data.memos || res.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = selectedBranch === 'all'
        ? `${API_URL}/api/admin/memos?type=note`
        : `${API_URL}/api/admin/memos?branch=${selectedBranch}&type=note`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data.memos || res.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        type: activeTab === 'memos' ? 'memo' : activeTab.slice(0, -1), // 'tasks' -> 'task'
        branch: formData.branch || null
      };

      await axios.post(`${API_URL}/api/admin/memos`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowForm(false);
      resetForm();
      if (activeTab === 'memos') fetchMemos();
      else if (activeTab === 'tasks') fetchTasks();
      else fetchNotes();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/memos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (activeTab === 'memos') fetchMemos();
      else if (activeTab === 'tasks') fetchTasks();
      else fetchNotes();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

      await axios.put(`${API_URL}/api/admin/memos/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (activeTab === 'memos') fetchMemos();
      else if (activeTab === 'tasks') fetchTasks();
      else fetchNotes();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      branch: '',
      dueDate: '',
      status: 'pending'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const renderList = (items) => {
    if (loading) {
      return (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="p-12 text-center text-gray-500">
          No {activeTab} found. Create one to get started!
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  {item.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  )}
                  {item.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {item.branch && (
                    <span className="flex items-center gap-1">
                      <Store size={12} />
                      {branches.find(b => b._id === item.branch)?.name || 'Unknown'}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {item.createdBy?.name || 'Admin'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {activeTab === 'tasks' && (
                  <button
                    onClick={() => handleToggleStatus(item._id, item.status)}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title={item.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <Clock size={18} />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Memos & Tasks</h1>
        <p className="text-gray-500 mt-1">Manage memos, tasks, and notes across all branches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('memos')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'memos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <FileText size={18} />
          Memos
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <CheckSquare size={18} />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'notes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <StickyNote size={18} />
          Notes
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTab === 'tasks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {activeTab === 'memos' && renderList(memos)}
        {activeTab === 'tasks' && renderList(tasks)}
        {activeTab === 'notes' && renderList(notes)}
      </div>
    </div>
  );
}
