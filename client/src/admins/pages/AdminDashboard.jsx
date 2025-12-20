import React, { useState, useEffect } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import QRCodeGenerator from '../../user/components/QRCodeGenerator';
import Sidebar from '../components/admin/Sidebar';
import SkeletonDashboard from '../../components/skeletons/SkeletonDashboard';
import ConfirmationModal from '../components/branch/ConfirmationModal';
import { 
  LogOut, 
  Store, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  MoreVertical,
  CheckCircle,
  XCircle,
  QrCode,
  IndianRupee
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalBranches: 0,
    activeBranches: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('branches');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    isLoading: false,
    onConfirm: null
  });
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    branchCode: '',
    email: '',
    mobileNumber: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Fetch Analytics
      const analyticsRes = await axios.get(`${API_URL}/api/admin/analytics`);
      const global = analyticsRes.data.global;
      setStats({
        totalBranches: global.branches?.total || 0,
        activeBranches: global.branches?.active || 0,
        todayOrders: global.orders?.total || 0,
        todayRevenue: global.revenue?.today || 0
      });

      // Fetch Branches
      const branchesRes = await axios.get(`${API_URL}/api/admin/branches`);
      setBranches(branchesRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unable to load dashboard. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/admin/branches`, formData);
      
      // Reset and refresh
      setFormData({ name: '', branchCode: '', email: '', mobileNumber: '', password: '' });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Create branch error:', error);
      setModalState({
        isOpen: true,
        title: 'Error',
        description: 'Failed to create branch. Please check your input and try again.',
        confirmText: 'OK',
        isDangerous: true,
        onConfirm: null
      });
    }
  };

  const toggleBranchStatus = async (id, currentStatus) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/admin/branches/${id}/status`, {
        isActive: !currentStatus
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
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

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
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
      case 'branches':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Manage Branches</h2>
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <form onSubmit={handleCreateBranch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Branch Name"
                    required
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Branch Code (e.g. NYC01)"
                    required
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.branchCode}
                    onChange={e => setFormData({...formData, branchCode: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Manager Email"
                    required
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number (e.g. +1234567890)"
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.mobileNumber}
                    onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  <div className="lg:col-span-4 flex justify-end space-x-3">
                    <button 
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Create Branch
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Branch Name</th>
                    <th className="px-6 py-4 font-medium">Code</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branches.map((branch) => (
                    <tr key={branch._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{branch.name}</div>
                        <div className="text-xs text-gray-500">{branch.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {branch.branchCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(branch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleBranchStatus(branch._id, branch.isActive)}
                          className={`text-sm font-medium ${
                            branch.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {branch.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No branches found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'qrcodes':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">QR Code Management</h2>
            {branches.length > 0 ? (
              <QRCodeGenerator branches={branches} />
            ) : (
              <div className="p-12 text-center">
                <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Create a branch first to generate QR codes.</p>
              </div>
            )}
          </div>
        );
      case 'stats':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Detailed Statistics</h3>
            <p className="text-gray-500 mt-2">Advanced analytics and branch-wise performance metrics coming soon.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">System Reports</h3>
            <p className="text-gray-500 mt-2">Downloadable PDF/Excel reports for all branches coming soon.</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
            <p className="text-gray-500 mt-2">Centralized notification center for all branches coming soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.username}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Branches" 
            value={stats.totalBranches} 
            icon={<Store className="h-6 w-6 text-blue-600" />}
            bg="bg-blue-50"
          />
          <StatCard 
            title="Active Branches" 
            value={stats.activeBranches} 
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            bg="bg-green-50"
          />
          <StatCard 
            title="Today's Orders" 
            value={stats.todayOrders} 
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            bg="bg-purple-50"
          />
          <StatCard 
            title="Today's Revenue" 
            value={formatCurrency(stats.todayRevenue)} 
            icon={<IndianRupee className="h-6 w-6 text-yellow-600" />}
            bg="bg-yellow-50"
          />
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </main>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDangerous={modalState.isDangerous}
        isLoading={modalState.isLoading}
      />
    </div>
  );
}

const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
    <div className={`p-3 rounded-lg ${bg} mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);
