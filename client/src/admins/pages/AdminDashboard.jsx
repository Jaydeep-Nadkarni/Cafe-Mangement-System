import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import QRCodeGenerator from '../../components/QRCodeGenerator';
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
  QrCode
} from 'lucide-react';
import axios from 'axios';

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('branches'); // branches or qrcode
  
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
      alert(error.response?.data?.message || 'Failed to create branch');
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

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-bg-cream">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.username}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            value={`$${stats.todayRevenue.toFixed(2)}`} 
            icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
            bg="bg-yellow-50"
          />
        </div>

        {/* Branch Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100 flex">
            <button
              onClick={() => setActiveTab('branches')}
              className={`flex-1 py-4 px-6 font-medium text-sm text-center border-b-2 transition-colors ${
                activeTab === 'branches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Store className="h-4 w-4 inline mr-2" />
              Branches
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 py-4 px-6 font-medium text-sm text-center border-b-2 transition-colors ${
                activeTab === 'qrcode'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCode className="h-4 w-4 inline mr-2" />
              QR Codes
            </button>
          </div>

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <>
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
            </>
          )}

          {/* QR Code Tab */}
          {activeTab === 'qrcode' && branches.length > 0 && (
            <div className="p-6">
              <QRCodeGenerator branches={branches} />
            </div>
          )}

          {/* No Branches Message for QR Code Tab */}
          {activeTab === 'qrcode' && branches.length === 0 && (
            <div className="p-12 text-center">
              <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Create a branch first to generate QR codes.</p>
            </div>
          )}
        </div>
      </main>
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
