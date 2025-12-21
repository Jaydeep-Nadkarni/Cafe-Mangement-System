import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Utensils, 
  LayoutGrid, 
  BarChart2, 
  Brain,
  FileText, 
  Settings, 
  Bell, 
  StickyNote,
  LogOut,
  Store
} from 'lucide-react';
import axios from 'axios';

export default function Sidebar({ activeTab, setActiveTab, branchName, onLogout }) {
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadMemos, setUnreadMemos] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch unread counts
  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const [alertsRes, memosRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/alerts?branch=${localStorage.getItem('branchId')}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/api/admin/memos?branch=${localStorage.getItem('branchId')}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      // Count unread alerts
      const unreadAlertCount = alertsRes.data.filter(a => !a.isRead && !a.isDismissed).length;
      setUnreadAlerts(unreadAlertCount);

      // Count unread memos for current user
      const userId = localStorage.getItem('userId');
      const unreadMemoCount = memosRes.data.filter(memo => {
        const readStatus = memo.readByManagers.find(r => r.manager?._id === userId || r.manager === userId);
        return !readStatus; // Unread if not in readByManagers array
      }).length;
      setUnreadMemos(unreadMemoCount);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      setLoading(false);
    }
  };

  // Listen for badge updates
  useEffect(() => {
    const interval = setInterval(fetchUnreadCounts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'inventory', label: 'Inventory', icon: Utensils },
    { id: 'tables', label: 'Tables', icon: LayoutGrid },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts },
    { id: 'memos', label: 'Memos', icon: StickyNote, badge: unreadMemos },
  ];

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Store className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 truncate max-w-35">{branchName || 'Branch'}</h1>
            <p className="text-xs text-gray-500">Manager Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasBadge = item.badge && item.badge > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                activeTab === item.id
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`} />
                {hasBadge && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
