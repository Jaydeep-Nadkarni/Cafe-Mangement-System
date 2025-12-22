import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Award, AlertTriangle, Info, XCircle, CheckCircle, Eye, EyeOff, Store, Trophy, Star, Target } from 'lucide-react';
import axios from 'axios';
import { formatDateTime } from '../../../utils/formatCurrency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
    fetchAlerts();
  }, []);

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

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/admin/alerts`;
      const params = [];
      if (selectedBranch !== 'all') params.push(`branch=${selectedBranch}`);
      if (severityFilter !== 'all') params.push(`severity=${severityFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin/alerts/${alertId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin/alerts/${alertId}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/admin/alerts/${alertId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      info: <Info className="w-5 h-5 text-blue-600" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      critical: <XCircle className="w-5 h-5 text-red-600" />
    };
    return icons[severity] || icons.info;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Alerts & Achievements
        </h1>
        <p className="text-gray-500 mt-1">Monitor system alerts and track achievements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'alerts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Bell size={18} />
          Alerts
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'achievements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Award size={18} />
          Achievements
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            <select
              value={selectedBranch}
              onChange={(e) => { setSelectedBranch(e.target.value); fetchAlerts(); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); fetchAlerts(); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'alerts' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Bell className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600">No alerts at the moment</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert._id}
                className={`rounded-xl border-2 p-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                  } ${alert.isRead ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        {!alert.isRead && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                        )}
                        {alert.isSystemGenerated && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">System</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(alert.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!alert.isRead && (
                      <button onClick={() => handleMarkAsRead(alert._id)} className="p-1 text-gray-400 hover:text-blue-600" title="Mark as read">
                        <Eye size={18} />
                      </button>
                    )}
                    {!alert.isDismissed && (
                      <button onClick={() => handleDismiss(alert._id)} className="p-1 text-gray-400 hover:text-yellow-600" title="Dismiss">
                        <EyeOff size={18} />
                      </button>
                    )}
                    <button onClick={() => deleteAlert(alert._id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 1, title: 'Revenue Milestone', desc: 'Reached ₹1,00,000 in monthly revenue', icon: Trophy, unlocked: true },
            { id: 2, title: '100 Orders', desc: 'Processed 100 orders in a single day', icon: Target, unlocked: true },
            { id: 3, title: 'Perfect Week', desc: 'Zero payment failures for 7 consecutive days', icon: Star, unlocked: true },
            { id: 4, title: 'Customer Favorite', desc: 'Maintain 4.5+ rating for 30 days', icon: Award, unlocked: false }
          ].map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className={`rounded-xl border-2 p-6 ${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-50'
                }`}>
                <div className="flex items-start gap-4">
                  <div className={achievement.unlocked ? '' : 'grayscale'}>
                    <Icon className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{achievement.desc}</p>
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={16} /> Unlocked
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm font-medium">Locked</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
