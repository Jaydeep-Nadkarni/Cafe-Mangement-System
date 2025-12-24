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
import { useBranchSocket } from '../../../user/hooks/useBranchSocket';

export default function Sidebar({ activeTab, setActiveTab, branchName, branchId, onLogout }) {
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadMemos, setUnreadMemos] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch unread counts
  useEffect(() => {
    // Only fetch if branchId is available
    if (branchId) {
      fetchUnreadCounts();
    }
  }, [branchId]);

  // Socket integration for real-time badge updates
  useBranchSocket(branchId, {
    onNewAlert: (alert) => {
      if (!alert.isRead && !alert.isDismissed) {
        setUnreadAlerts(prev => prev + 1);
      }
    },
    onMemoCreated: () => {
      // When a memo is created, increase unread count for managers
      const role = localStorage.getItem('userRole');
      if (role !== 'admin' && role !== 'superadmin') {
        setUnreadMemos(prev => prev + 1);
      }
    }
  });

  const fetchUnreadCounts = async () => {
    try {
      const currentBranchId = branchId || localStorage.getItem('branchId');
      
      // Skip if no branch ID available
      if (!currentBranchId) {
        setLoading(false);
        return;
      }
      
      const [alertsRes, memosRes] = await Promise.all([
        axios.get(`${API_URL}/api/branch/alerts?branch=${currentBranchId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/api/branch/memos?branch=${currentBranchId}`, {
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
    if (!branchId) return;
    
    const interval = setInterval(fetchUnreadCounts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [branchId]);

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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${activeTab === item.id
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="flex-1 text-left flex items-center gap-2">
                {item.label}
                {hasBadge && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </span>
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
