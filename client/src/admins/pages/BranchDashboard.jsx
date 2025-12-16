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
import Reports from '../components/branch/Reports';
import Settings from '../components/branch/Settings';
import Alerts from '../components/branch/Alerts';
import Memos from '../components/branch/Memos';

export default function BranchDashboard() {
  const { user, logout } = useAuth();
  const [branch, setBranch] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Fetch Initial Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <Orders tables={tables} menu={menu} onRefresh={fetchData} />;
      case 'inventory':
        return <Inventory menu={menu} setMenu={setMenu} />;
      case 'tables':
        return <Tables tables={tables} onRefresh={fetchData} />;
      case 'stats':
        return <Stats />;
      case 'reports':
        return <Reports />;
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
    <div className="min-h-screen bg-gray-50 flex">
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
