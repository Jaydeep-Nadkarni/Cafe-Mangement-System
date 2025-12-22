import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Store } from 'lucide-react';
import BranchReports from '../branch/Reports';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Reports() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  // Auto-select if only one branch
  useEffect(() => {
    if (branches.length === 1 && !selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [branches, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Single branch mode - no selector needed
  if (branches.length === 1) {
    return <BranchReports branch={branches[0]} />;
  }

  // Multiple branches - show selector
  if (!selectedBranch) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Store className="inline w-4 h-4 mr-1" />
            Select Branch
          </label>
          <select
            onChange={(e) => {
              const branch = branches.find(b => b._id === e.target.value);
              setSelectedBranch(branch);
            }}
            className="w-full max-w-md border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Choose a branch...</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Branch Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            <Store className="inline w-4 h-4 mr-1" />
            Branch:
          </label>
          <select
            value={selectedBranch._id}
            onChange={(e) => {
              const branch = branches.find(b => b._id === e.target.value);
              setSelectedBranch(branch);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Manager Reports Component */}
      <BranchReports branch={selectedBranch} />
    </div>
  );
}
