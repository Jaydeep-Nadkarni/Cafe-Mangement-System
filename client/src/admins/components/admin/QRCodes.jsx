import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader, Copy, Check, Store, QrCode, Search } from 'lucide-react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodes() {
  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [fetchingBranches, setFetchingBranches] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const qrRefs = useRef({});

  useEffect(() => {
    fetchBranches();
  }, []);

  // Auto-select if only one branch exists
  useEffect(() => {
    if (!fetchingBranches && branches.length === 1 && !selectedBranch) {
      handleBranchSelect(branches[0]);
    }
  }, [branches, fetchingBranches, selectedBranch]);

  const fetchBranches = async () => {
    try {
      setFetchingBranches(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/admin/branches`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setFetchingBranches(false);
    }
  };

  const handleBranchSelect = async (branch) => {
    try {
      setLoading(true);
      setSelectedBranch(branch);
      setTables([]);

      const token = localStorage.getItem('token');
      
      // --- FIX: Removed spaces in URL and Header ---
      const response = await axios.get(
        `${API_URL}/api/branch/tables`, 
        {
          params: { branch: branch._id },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const tablesList = Array.isArray(response.data) ? response.data : response.data.tables || [];
      setTables(tablesList);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUrl = (branch, table) => {
    if (!branch || !table) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/menu?branch=${branch.branchCode || branch._id}&table=${table.tableNumber}`;
  };

  const copyToClipboard = (url, tableId) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(tableId);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const downloadQRCode = (tableId, tableName) => {
    const canvas = qrRefs.current[tableId];
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qrcode-${tableName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">QR Management</h2>
        <p className="text-gray-500 mt-2 text-lg">Generate, view, and download QR codes for your tables.</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Branch Selection Section */}
        <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <Store className="text-gray-400" size={20}/>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Select Branch</h3>
            </div>
          
          {fetchingBranches ? (
            <div className="flex gap-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-14 w-48 bg-gray-200 rounded-xl"></div>)}
            </div>
          ) : branches.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500">
                No branches found. Please create a branch first.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {branches.map((branch) => {
                const isSelected = selectedBranch?._id === branch._id;
                return (
                  <button
                    key={branch._id}
                    onClick={() => handleBranchSelect(branch)}
                    className={`
                      relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 border text-left min-w-[200px]
                      ${isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 transform scale-[1.02]' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <Store size={18} className={isSelected ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <span className="font-semibold text-sm">{branch.name}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                         <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Area */}
        {selectedBranch ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Tables <span className="text-gray-400 font-normal">/</span> <span className="text-blue-600">{selectedBranch.name}</span>
              </h3>
              <span className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium shadow-sm">
                {tables.length} Total Tables
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Loader className="animate-spin text-blue-600 mb-3" size={40} />
                <p className="text-gray-500 font-medium">Loading tables configuration...</p>
              </div>
            ) : tables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => {
                  const url = generateUrl(selectedBranch, table);
                  const isAvailable = table.status === 'available';

                  return (
                    <div key={table._id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
                      {/* Card Header */}
                      <div className="px-5 pt-5 pb-3 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Table No.</p>
                            <h4 className="text-2xl font-bold text-gray-900">{table.tableNumber}</h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                            isAvailable 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {table.status}
                        </span>
                      </div>

                      <div className="w-full h-px bg-gray-100"></div>

                      {/* QR Section */}
                      <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 group-hover:bg-blue-50/30 transition-colors">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4 group-hover:scale-105 transition-transform duration-300">
                          <QRCodeCanvas
                            value={url}
                            size={140}
                            level={"H"}
                            includeMargin={true}
                            imageSettings={{
                              src: "/logo-icon.png", // Ensure this exists in your public folder
                              height: 24,
                              width: 24,
                              excavate: true,
                            }}
                            ref={(el) => (qrRefs.current[table._id] = el)}
                          />
                        </div>
                      </div>

                      {/* Action Section */}
                      <div className="p-5 bg-white border-t border-gray-100 space-y-3">
                        {/* URL Copy Input */}
                        <div className="relative flex items-center">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={14} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                readOnly
                                className="block w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <button
                                onClick={() => copyToClipboard(url, table._id)}
                                className="absolute right-1 top-1 p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-blue-600 hover:shadow-sm transition-all"
                                title="Copy Link"
                            >
                                {copiedUrl === table._id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Download Button */}
                        <button
                          onClick={() => downloadQRCode(table._id, table.name || `Table ${table.tableNumber}`)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow text-sm font-medium"
                        >
                          <Download size={16} /> 
                          <span>Download QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <QrCode size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No tables configured</h3>
                <p className="text-gray-500 max-w-sm text-center mt-1">
                    There are no tables set up for this branch yet. Please go to Branch Settings to add tables.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty State for No Branch Selected */
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-blue-50 p-6 rounded-full shadow-inner mb-6">
              <Store size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Select a Branch</h3>
            <p className="text-gray-500 max-w-md text-center mt-2 leading-relaxed">
              Select a branch from the list above to view, manage, and download QR codes for your tables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}