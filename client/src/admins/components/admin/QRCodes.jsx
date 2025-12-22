import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodes() {
  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Refs to store QR code canvas elements
  const qrRefs = useRef({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/admin/branches`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Codes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Branch</h3>
          <div className="space-y-2">
            {branches.map((branch) => (
              <button
                key={branch._id}
                onClick={() => handleBranchSelect(branch)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${selectedBranch?._id === branch._id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <div className="font-medium text-gray-900">{branch.name}</div>
                <div className="text-sm text-gray-600">{branch.location}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tables QR Codes */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : selectedBranch && tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => {
                const url = generateUrl(selectedBranch, table);
                return (
                  <div key={table._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">{table.name || `Table ${table.tableNumber}`}</h4>

                    <div className="space-y-3">
                      {/* QR Code Image */}
                      <div className="bg-white p-4 rounded-lg flex items-center justify-center border border-gray-100">
                        <QRCodeCanvas
                          value={url}
                          size={150}
                          level={"H"}
                          includeMargin={true}
                          ref={(el) => (qrRefs.current[table._id] = el)}
                        />
                      </div>

                      {/* URL Display */}
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Ordering URL:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            readOnly
                            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-600"
                          />
                          <button
                            onClick={() => copyToClipboard(url, table._id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Copy URL"
                          >
                            {copiedUrl === table._id ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Download Button */}
                      <button
                        onClick={() => downloadQRCode(table._id, table.name || `Table ${table.tableNumber}`)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : selectedBranch ? (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
              No tables found for this branch
            </div>
          ) : (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
              Select a branch to view table QR codes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
