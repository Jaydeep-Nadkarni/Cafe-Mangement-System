import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Printer,
  User,
  Bell,
  Save,
  Volume2,
  VolumeX,
  CreditCard,
  Shield,
  Monitor,
  Building
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function Settings({ branch }) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local Settings State
  const [settings, setSettings] = useState({
    printerIp: localStorage.getItem('printerIp') || '192.168.1.100',
    printerPort: localStorage.getItem('printerPort') || '9100',
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    autoPrint: localStorage.getItem('autoPrint') === 'true',
    darkMode: localStorage.getItem('darkMode') === 'true',
    currencySymbol: '₹',
    billFooter: 'Thank you for visiting!'
  });

  // Branch Profile State
  const [branchProfile, setBranchProfile] = useState({
    name: '',
    fullAddress: '',
    phone: '',
    mobileNumber: '',
    email: '',
    gstNumber: '',
    cgstRate: 0,
    sgstRate: 0,
    logo: null
  });

  // Load branch profile on mount
  useEffect(() => {
    if (activeTab === 'profile') {
      fetchBranchProfile();
    }
  }, [activeTab]);

  const fetchBranchProfile = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('cafe_token');
      const res = await axios.get(`${API_URL}/api/branch/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranchProfile(res.data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load branch profile');
      console.error('Error fetching branch profile:', err);
    }
  };

  // Profile Settings State (Mock)
  const [profile, setProfile] = useState({
    name: 'Branch Manager',
    email: 'manager@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = () => {
    setLoading(true);
    setErrorMsg('');

    // Save to localStorage
    localStorage.setItem('printerIp', settings.printerIp);
    localStorage.setItem('printerPort', settings.printerPort);
    localStorage.setItem('soundEnabled', settings.soundEnabled);
    localStorage.setItem('autoPrint', settings.autoPrint);
    localStorage.setItem('darkMode', settings.darkMode);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleSaveBranchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('cafe_token');
      
      const res = await axios.put(`${API_URL}/api/branch/profile`, branchProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBranchProfile(res.data.data);
      setSuccessMsg('Branch profile saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save branch profile');
      console.error('Error saving branch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Branch Profile', icon: Building },
    { id: 'hardware', label: 'Hardware & Printers', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-gray-700" />
          Branch Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure your branch preferences and hardware</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200">
          <nav className="p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Branch Profile Information</h2>

              <div className="grid gap-6">
                {/* Branch Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Cafe Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cafe Name</label>
                      <input
                        type="text"
                        value={branchProfile.name}
                        onChange={e => setBranchProfile({ ...branchProfile, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                      <input
                        type="text"
                        value={branchProfile.branchCode}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={branchProfile.phone}
                        onChange={e => setBranchProfile({ ...branchProfile, phone: e.target.value })}
                        placeholder="e.g. +91-1234567890"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={branchProfile.mobileNumber}
                        onChange={e => setBranchProfile({ ...branchProfile, mobileNumber: e.target.value })}
                        placeholder="e.g. +91-9876543210"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={branchProfile.email}
                      onChange={e => setBranchProfile({ ...branchProfile, email: e.target.value })}
                      placeholder="e.g. cafe@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                  <textarea
                    value={branchProfile.fullAddress}
                    onChange={e => setBranchProfile({ ...branchProfile, fullAddress: e.target.value })}
                    placeholder="Enter complete address including street, city, state, and postal code"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* GST Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">GST Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        value={branchProfile.gstNumber}
                        onChange={e => setBranchProfile({ ...branchProfile, gstNumber: e.target.value })}
                        placeholder="e.g. 27AAJPT7654H1Z0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">15-digit GST identification number</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CGST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={branchProfile.cgstRate}
                        onChange={e => setBranchProfile({ ...branchProfile, cgstRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SGST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={branchProfile.sgstRate}
                        onChange={e => setBranchProfile({ ...branchProfile, sgstRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 rounded text-xs text-blue-700">
                    <p><strong>Total GST:</strong> {(branchProfile.cgstRate + branchProfile.sgstRate).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">General Preferences</h2>

              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Dark Mode (Beta)</p>
                      <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.darkMode}
                      onChange={e => setSettings({ ...settings, darkMode: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Footer Message</label>
                  <input
                    type="text"
                    value={settings.billFooter}
                    onChange={e => setSettings({ ...settings, billFooter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This message will appear at the bottom of printed receipts.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Hardware Configuration</h2>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Network Printer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Printer IP Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.200"
                      value={settings.printerIp}
                      onChange={e => setSettings({ ...settings, printerIp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="text"
                      placeholder="9100"
                      value={settings.printerPort}
                      onChange={e => setSettings({ ...settings, printerPort: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-4">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Auto-Print Receipts</p>
                    <p className="text-sm text-gray-500">Automatically print receipt after checkout</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.autoPrint}
                    onChange={e => setSettings({ ...settings, autoPrint: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Notification Settings</h2>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  <div>
                    <p className="font-medium text-gray-900">Sound Alerts</p>
                    <p className="text-sm text-gray-500">Play sound when new order arrives</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.soundEnabled}
                    onChange={e => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p className="font-bold mb-1 flex items-center gap-2"><Bell className="w-4 h-4" /> System Info</p>
                <p>Browser notifications must be allowed for best experience. Ensure checking your browser permission settings.</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium h-5">{successMsg}</span>
            <button
              onClick={() => activeTab === 'profile' ? handleSaveBranchProfile() : handleSave()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
