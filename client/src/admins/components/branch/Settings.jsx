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
  Monitor
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function Settings({ branch }) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'hardware', label: 'Hardware & Printers', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    //  { id: 'profile', label: 'Profile & Security', icon: User } // Can add later if needed
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
              onClick={handleSave}
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
