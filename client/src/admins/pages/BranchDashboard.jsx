import React, { useState, useEffect } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { useBranchSocket } from '../../user/hooks/useBranchSocket';
import axios from 'axios';

// Components
import Sidebar from '../components/branch/Sidebar';
import Orders from '../components/branch/Orders';
import Inventory from '../components/branch/Inventory';
import Tables from '../components/branch/Tables';
import Stats from '../components/branch/Stats';
import AIAnalysis from '../components/branch/AIAnalysis';
import Reports from '../components/branch/Reports';
import Settings from '../components/branch/Settings';
import Alerts from '../components/branch/Alerts';
import Memos from '../components/branch/Memos';
import SkeletonDashboard from '../../components/skeletons/SkeletonDashboard';

export default function BranchDashboard() {
  const { user, logout } = useAuth();
  const [branch, setBranch] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  // Fetch Initial Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // 1. Get Branch Details
      const branchRes = await axios.get(`${API_URL}/api/branch/details`);
      setBranch(branchRes.data);

      // 2. Get Tables (with active orders)
      const tablesRes = await axios.get(`${API_URL}/api/branch/tables`);
      setTables(tablesRes.data);

      // 3. Get Menu (for inventory)
      const menuRes = await axios.get(`${API_URL}/api/branch/menu`);
      setMenu(menuRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching branch data:', error);
      
      if (error.response?.status === 404) {
        setError('Your account needs configuration. Contact admin.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        logout();
      } else {
        setError('Unable to load dashboard. Please try again later.');
      }
      
      setLoading(false);
    }
  };

  // Real-time Updates
  useBranchSocket(branch?._id, {
    onNewOrder: (data) => {
      fetchData();
    },
    onOrderStatusChange: (data) => {
      fetchData();
    },
    onPaymentConfirmation: (data) => {
      fetchData();
    },
    onTableMerge: (data) => {
      fetchData();
    }
  });

  // Store branch info in localStorage for Sidebar
  useEffect(() => {
    if (branch?._id) {
      localStorage.setItem('branchId', branch._id);
    }
  }, [branch]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="bg-gray-50 p-6 rounded-lg">
          <SkeletonDashboard />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard Unavailable</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'orders':
        return <Orders tables={tables} menu={menu} onRefresh={fetchData} />;
      case 'inventory':
        return <Inventory menu={menu} setMenu={setMenu} />;
      case 'tables':
        return <Tables tables={tables} onRefresh={fetchData} />;
      case 'stats':
        return <Stats branch={branch} />;
      case 'ai-analysis':
        return <AIAnalysis branch={branch} />;
      case 'reports':
        return <Reports branch={branch} />;
      case 'settings':
        return <Settings />;
      case 'alerts':
        return <Alerts branch={branch} />;
      case 'memos':
        return <Memos branch={branch} />;
      default:
        return <Orders tables={tables} onRefresh={fetchData} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        branchName={branch?.name}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
}
