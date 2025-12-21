import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, DollarSign, Info, Plus, X, Edit2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useBranchSocket } from '../../../user/hooks/useBranchSocket';
import ConfirmationModal from './ConfirmationModal';

export default function Alerts({ branch }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('active'); // 'active', 'read', 'dismissed', 'all'
  const [loadingId, setLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    isDangerous: false,
    isLoading: false
  });
  const [newAlert, setNewAlert] = useState({
    type: 'system',
    title: '',
    message: '',
    priority: 'medium',
    actionUrl: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    const id = localStorage.getItem('userId');
    setUserRole(role);
    setUserId(id);
    fetchAlerts();
  }, []);

  useBranchSocket(branch?._id, {
    onNewAlert: (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    }
  });

  const fetchAlerts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${API_URL}/api/admin/alerts`, {
        params: { 
          branch: branch?._id,
          dismissed: filter === 'dismissed' ? 'true' : filter === 'active' ? 'false' : undefined
        }
      });
      let filtered = res.data;
      if (filter === 'read') {
        filtered = filtered.filter(a => a.isRead && !a.isDismissed);
      } else if (filter === 'active') {
        filtered = filtered.filter(a => !a.isRead && !a.isDismissed);
      }
      setAlerts(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.message) {
      setConfirmModal({
        isOpen: true,
        title: 'Missing Fields',
        description: 'Title and message are required',
        onConfirm: null,
        isDangerous: false
      });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/admin/alerts`, {
        ...newAlert,
        branch: branch?._id
      });
      setAlerts([res.data, ...alerts]);
      resetForm();
    } catch (error) {
      console.error('Error creating alert:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to create alert. Please try again.',
        onConfirm: null,
        isDangerous: true
      });
    }
  };

  const updateAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.message) {
      setConfirmModal({
        isOpen: true,
        title: 'Missing Fields',
        description: 'Title and message are required',
        onConfirm: null,
        isDangerous: false
      });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${API_URL}/api/admin/alerts/${editingId}`, newAlert);
      setAlerts(alerts.map(a => a._id === editingId ? res.data : a));
      resetForm();
    } catch (error) {
      console.error('Error updating alert:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to update alert. Please try again.',
        onConfirm: null,
        isDangerous: true
      });
    }
  };

  const markAsRead = async (id) => {
    setLoadingId(id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/admin/alerts/${id}/read`);
      setAlerts(prev => prev.map(alert => 
        alert._id === id ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to mark alert as read.',
        onConfirm: null,
        isDangerous: true
      });
    } finally {
      setLoadingId(null);
    }
  };

  const dismissAlert = async (id) => {
    setLoadingId(id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/admin/alerts/${id}/dismiss`);
      setAlerts(prev => prev.filter(alert => alert._id !== id));
    } catch (error) {
      console.error('Error dismissing alert:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to dismiss alert.',
        onConfirm: null,
        isDangerous: true
      });
    } finally {
      setLoadingId(null);
    }
  };

  const deleteAlert = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Alert',
      description: 'Are you sure you want to delete this alert? This action cannot be undone.',
      isDangerous: true,
      isLoading: false,
      onConfirm: async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          await axios.delete(`${API_URL}/api/admin/alerts/${id}`);
          setAlerts(prev => prev.filter(alert => alert._id !== id));
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          console.error('Error deleting alert:', error);
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            description: 'Failed to delete alert. Please try again.',
            onConfirm: null,
            isDangerous: true
          });
        }
      }
    });
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setNewAlert({
      type: 'system',
      title: '',
      message: '',
      priority: 'medium',
      actionUrl: ''
    });
  };

  const startEdit = (alert) => {
    setNewAlert({
      type: alert.type,
      title: alert.title,
      message: alert.message,
      priority: alert.priority,
      actionUrl: alert.actionUrl || ''
    });
    setEditingId(alert._id);
    setShowModal(true);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'system': return <Info className="w-5 h-5 text-orange-500" />;
      case 'kitchen': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'memo': return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'task': return <CheckCircle className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const isAdminOnly = userRole === 'admin' || userRole === 'superadmin';
  const unreadCount = alerts.filter(a => !a.isRead && !a.isDismissed).length;

  if (loading) return <div className="p-4">Loading alerts...</div>;

  return (
    <>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        isDangerous={confirmModal.isDangerous}
        isLoading={confirmModal.isLoading}
      />

      <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Alerts & Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} Unread
            </span>
          )}
        </div>
        {isAdminOnly && (
          <button 
            onClick={() => {
              setEditingId(null);
              setNewAlert({
                type: 'system',
                title: '',
                message: '',
                priority: 'medium',
                actionUrl: ''
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Alert</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        {['active', 'read', 'dismissed', 'all'].map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              // Re-fetch with new filter
              setTimeout(() => fetchAlerts(), 0);
            }}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              filter === f 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f === 'active' ? 'Unread' : f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No alerts to display</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert._id} 
              className={`p-4 rounded-lg border-l-4 flex items-start justify-between transition-all hover:shadow-md ${
                alert.isRead 
                  ? 'bg-white border-gray-300 border-l-gray-300' 
                  : `${getPriorityColor(alert.priority)} border-l-red-500`
              }`}
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${alert.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {alert.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getPriorityColor(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{alert.message}</p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                {!alert.isRead && (
                  <button 
                    onClick={() => markAsRead(alert._id)}
                    disabled={loadingId === alert._id}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mark as read"
                  >
                    {loadingId === alert._id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                )}
                {isAdminOnly && (
                  <button 
                    onClick={() => startEdit(alert)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit alert"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => dismissAlert(alert._id)}
                  disabled={loadingId === alert._id}
                  className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Dismiss alert"
                >
                  {loadingId === alert._id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
                {isAdminOnly && (
                  <button 
                    onClick={() => deleteAlert(alert._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingId ? 'Edit Alert' : 'Create New Alert'}
              </h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingId ? updateAlert : createAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAlert.type}
                  onChange={e => setNewAlert({...newAlert, type: e.target.value})}
                >
                  <option value="system">System</option>
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="memo">Memo</option>
                  <option value="task">Task</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAlert.title}
                  onChange={e => setNewAlert({...newAlert, title: e.target.value})}
                  placeholder="Alert title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAlert.priority}
                  onChange={e => setNewAlert({...newAlert, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows="3"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAlert.message}
                  onChange={e => setNewAlert({...newAlert, message: e.target.value})}
                  placeholder="Alert message"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAlert.actionUrl}
                  onChange={e => setNewAlert({...newAlert, actionUrl: e.target.value})}
                  placeholder="Link to related resource"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
