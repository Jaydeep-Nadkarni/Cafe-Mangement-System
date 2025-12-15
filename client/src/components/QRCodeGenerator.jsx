import React, { useState } from 'react';
import { QrCode, Download, Copy, CheckCircle } from 'lucide-react';

/**
 * Generate QR Code URL for table ordering
 * Format: /menu?branch=BRANCHCODE&table=TABLENUMBER
 */
export default function QRCodeGenerator({ branches }) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [generatedURL, setGeneratedURL] = useState('');
  const [copied, setCopied] = useState(false);

  const generateQRURL = () => {
    if (!selectedBranch || !tableNumber) {
      alert('Please select a branch and enter a table number');
      return;
    }

    const baseURL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
    const url = `${baseURL}/menu?branch=${selectedBranch}&table=${tableNumber}`;
    setGeneratedURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRCodeImage = () => {
    if (!generatedURL) return;

    // Use QR code API from qr-server.com (free, no dependencies needed)
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedURL)}`;
    
    // Create a temporary link and download
    const link = document.createElement('a');
    link.href = qrCodeURL;
    link.download = `table-${tableNumber}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <div className="bg-purple-100 p-2 rounded-lg mr-3">
          <QrCode className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">QR Code Generator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Branch Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select a branch...</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch.branchCode}>
                {branch.name} ({branch.branchCode})
              </option>
            ))}
          </select>
        </div>

        {/* Table Number Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table Number
          </label>
          <input
            type="number"
            min="1"
            max="999"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="e.g., 7"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Generate Button */}
        <div className="flex items-end">
          <button
            onClick={generateQRURL}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            Generate URL
          </button>
        </div>
      </div>

      {/* Generated URL Display */}
      {generatedURL && (
        <div className="space-y-4">
          {/* URL Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedURL}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Preview
            </label>
            <div className="flex gap-4 items-start">
              <div className="bg-gray-50 p-4 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedURL)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with a mobile device to access the menu for:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Branch:</span>
                    <span className="text-gray-600 ml-2">
                      {branches.find(b => b.branchCode === selectedBranch)?.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Table:</span>
                    <span className="text-gray-600 ml-2">#{tableNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-end">
            <button
              onClick={generateQRCodeImage}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
