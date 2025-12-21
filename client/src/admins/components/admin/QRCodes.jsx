import React, { useState, useEffect } from 'react';
import { Download, Loader } from 'lucide-react';
import axios from 'axios';

export default function QRCodes() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/branches`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const generateQRCode = async (branchId) => {
    try {
      setLoading(true);
      setSelectedBranch(branchId);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/branches/${branchId}/qrcode`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCode(response.data.qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qrcode-${selectedBranch}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Codes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Branch</h3>
          <div className="space-y-2">
            {branches.map((branch) => (
              <button
                key={branch._id}
                onClick={() => generateQRCode(branch._id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  selectedBranch === branch._id
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

        {/* QR Code Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-8 rounded-lg flex items-center justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <button
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={20} /> Download QR Code
              </button>
            </div>
          ) : (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
              Select a branch to view QR code
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
