import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader, Copy, Check, Store } from 'lucide-react';
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

  // Refs to store QR code canvas elements
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
        `${API_URL} /api/admin / branches`,
        { headers: { Authorization: `Bearer ${token} ` } }
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
      setSelectedBranch(branch); // Store whole branch object
      setTables([]);

      const token = localStorage.getItem('token');
      // Fix: API expects 'branch' query param
      const response = await axios.get(
        `${API_URL} /api/branch / tables`,
        {
          params: { branch: branch._id },
          headers: { Authorization: `Bearer ${token} ` }
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
    // Use window.location.origin to get the base URL (e.g., http://localhost:5173)
    const baseUrl = window.location.origin;
    // Construct URL: /menu?branch=BRANCH_CODE&table=TABLE_NUMBER
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

    // Create download link
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qrcode-${tableName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">QR Codes Management</h2>
        <p className="text-gray-500 mt-1">Generate and manage QR codes for table ordering</p>
      </div>

      {/* Branch Selection - Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Branch</h3>

        {fetchingBranches ? (
          <div className="flex gap-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-12 w-40 bg-gray-100 rounded-lg"></div>)}
          </div>
        ) : branches.length === 0 ? (
          <p className="text-gray-500 text-sm">No branches found.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {branches.map((branch) => (
              <button
                key={branch._id}
                onClick={() => handleBranchSelect(branch)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 border ${selectedBranch?._id === branch._id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
              >
                <Store size={18} className={selectedBranch?._id === branch._id ? 'text-blue-100' : 'text-gray-400'} />
                <span className="font-medium">{branch.name}</span>
                {selectedBranch?._id === branch._id && (
                  <Check size={16} className="ml-1 text-blue-100" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tables Grid */}
      {selectedBranch ? (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">
              Tables for <span className="text-blue-600">{selectedBranch.name}</span>
            </h3>
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {tables.length} Tables Found
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Loader className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-gray-500">Loading tables...</p>
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tables.map((table) => {
                const url = generateUrl(selectedBranch, table);
                return (
                  <div key={table._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                          <h4 className="font-bold text-gray-900 text-lg">{table.tableNumber}</h4>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase ${table.status === 'available' ? 'bg-green-100 text-green-700' :
                          table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {table.status}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-center mb-4 relative z-0">
                        {/* QR Code */}
                        <QRCodeCanvas
                          value={url}
                          size={160}
                          level={"H"}
                          includeMargin={true}
                          imageSettings={{
                            src: "/logo-icon.png",
                            x: undefined,
                            y: undefined,
                            height: 24,
                            width: 24,
                            excavate: true,
                          }}
                          ref={(el) => (qrRefs.current[table._id] = el)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={url}
                            readOnly
                            className="w-full text-xs bg-gray-50 border border-gray-200 text-gray-500 rounded-lg pl-2 pr-8 py-2 focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard(url, table._id)}
                            className="absolute right-1 top-1 p-1 hover:bg-gray-200 rounded text-gray-500"
                            title="Copy URL"
                          >
                            {copiedUrl === table._id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>

                        <button
                          onClick={() => downloadQRCode(table._id, table.name || `Table ${table.tableNumber}`)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition active:scale-95 text-sm font-medium"
                        >
                          <Download size={16} /> Download QR
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
              <Store size={48} className="text-gray-300 mb-2" />
              <p>No tables found for this branch.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Store size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Select a Branch</h3>
          <p className="text-gray-500 max-w-sm text-center mt-1">Please select a branch from the top to view and manage table QR codes.</p>
        </div>
      )}
    </div>
  );
}
