import React, { useState, useEffect } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import axios from 'axios';

// Components
import Sidebar from '../components/admin/Sidebar';
import Branches from '../components/admin/Branches';
import QRCodes from '../components/admin/QRCodes';
import Stats from '../components/admin/Stats';
import Memos from '../components/admin/Memos';
import Coupons from '../components/admin/Coupons';
import Broadcast from '../components/admin/Broadcast';
import Reports from '../components/admin/Reports';
import Alerts from '../components/admin/Alerts';
import SkeletonDashboard from '../../components/skeletons/SkeletonDashboard';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('branches');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Unable to load dashboard. Please try again later.');
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="bg-gray-50 p-6 rounded-lg">
          <SkeletonDashboard />
        </div>
      );
    }

    switch (activeTab) {
      case 'branches':
        return <Branches />;
      case 'qrcodes':
        return <QRCodes />;
      case 'stats':
        return <Stats />;
      case 'memos':
        return <Memos />;
      case 'coupons':
        return <Coupons />;
      case 'broadcast':
        return <Broadcast />;
      case 'reports':
        return <Reports />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Branches />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.username}</p>
        </div>

        {/* Content */}
        {renderContent()}
      </main>
    </div>
  );
}
