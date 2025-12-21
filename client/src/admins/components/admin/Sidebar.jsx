import React, { useState, useEffect } from 'react';
import {
  Store,
  QrCode,
  BarChart2,
  FileText,
  Bell,
  LogOut,
  LayoutDashboard,
  Tag,
  MessageSquare,
  Radio
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'branches', label: 'Branches', icon: Store },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
    { id: 'stats', label: 'Statistics', icon: BarChart2 },
    { id: 'memos', label: 'Memos', icon: MessageSquare },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'broadcast', label: 'Broadcast', icon: Radio },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'alerts', label: 'Alerts', icon: Bell },
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
            <h1 className="font-bold text-gray-900 truncate max-w-35">Admin Panel</h1>
            <p className="text-xs text-gray-500">Cafe Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
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
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </div>
  );
}
