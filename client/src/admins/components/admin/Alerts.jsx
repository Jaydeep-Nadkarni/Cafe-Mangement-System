import React, { useState, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/alerts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(response.data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/alerts/${alertId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Alerts</h2>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <Bell className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">No alerts at the moment</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between hover:shadow-md transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    alert.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : alert.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-900 font-medium">{alert.message}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteAlert(alert._id)}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition ml-4 shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
