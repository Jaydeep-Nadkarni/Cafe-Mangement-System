import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, DollarSign, Info } from 'lucide-react';
import axios from 'axios';
import { useBranchSocket } from '../../../user/hooks/useBranchSocket';

export default function Alerts({ branch }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const res = await axios.get(`${API_URL}/api/branch/alerts`);
      setAlerts(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/branch/alerts/${id}/read`);
      setAlerts(prev => prev.map(alert => 
        alert._id === id ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const deleteAlert = async (id) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.delete(`${API_URL}/api/branch/alerts/${id}`);
      setAlerts(prev => prev.filter(alert => alert._id !== id));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'system': return <Info className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) return <div className="p-4">Loading alerts...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Alerts & Notifications</h2>
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          {alerts.filter(a => !a.isRead).length} Unread
        </span>
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
              className={`p-4 rounded-lg border flex items-start justify-between transition-colors ${
                alert.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                  {getIcon(alert.type)}
                </div>
                <div>
                  <h3 className={`font-semibold ${alert.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                    {alert.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{alert.message}</p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {!alert.isRead && (
                  <button 
                    onClick={() => markAsRead(alert._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => deleteAlert(alert._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
