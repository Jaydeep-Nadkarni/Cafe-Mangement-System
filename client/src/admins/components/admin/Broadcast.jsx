import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Send,
    Users,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    MessageSquare,
    Gift,
    Megaphone,
    CalendarClock,
    Filter,
    Eye
} from 'lucide-react';

export default function Broadcast() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        broadcastType: 'announcement',
        targetAudience: 'opt_in_only',
        channels: ['whatsapp'],
        scheduleTime: null,
        minOrderValue: 0,
        maxOrderValue: null,
        lastOrderWithinDays: 30,
        branches: []
    });
    const [status, setStatus] = useState(null);
    const [branches, setBranches] = useState([]);

    // Broadcast type options
    const broadcastTypes = [
        { value: 'offer', label: 'Special Offer', icon: Gift },
        { value: 'announcement', label: 'Announcement', icon: Megaphone },
        { value: 'event', label: 'Event', icon: Calendar },
        { value: 'menu_launch', label: 'Menu Launch', icon: MessageSquare }
    ];

    // Target audience options
    const audienceOptions = [
        { value: 'all_customers', label: 'All Customers', desc: 'Everyone with phone number' },
        { value: 'opt_in_only', label: 'Opted-In Only', desc: 'Customers who subscribed' },
        { value: 'vip_customers', label: 'VIP Customers', desc: 'High-value customers' },
        { value: 'recent_customers', label: 'Recent Customers', desc: 'Ordered in last X days' }
    ];

    const channels = [
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'sms', label: 'SMS' },
        { value: 'email', label: 'Email' }
    ];

    useEffect(() => {
        fetchBroadcasts();
        fetchBranches();
        fetchStats();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/admin/broadcast/logs?limit=20`);
            setBroadcasts(res.data.data);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
            setStatus({ type: 'error', text: 'Failed to load broadcasts' });
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/branches`);
            setBranches(res.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/broadcast/stats?days=30`);
            setStats(res.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'minOrderValue' || name === 'maxOrderValue' ? parseFloat(value) : value
        }));
    };

    const handleChannelToggle = (channel) => {
        setFormData(prev => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel]
        }));
    };

    const handleBranchToggle = (branchId) => {
        setFormData(prev => ({
            ...prev,
            branches: prev.branches.includes(branchId)
                ? prev.branches.filter(b => b !== branchId)
                : [...prev.branches, branchId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            setStatus({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        if (formData.channels.length === 0) {
            setStatus({ type: 'error', text: 'Please select at least one channel' });
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/admin/broadcast/send`, formData);

            if (res.data.success) {
                setStatus({
                    type: 'success',
                    text: `Broadcast ${formData.scheduleTime ? 'scheduled' : 'sent'} successfully!`
                });
                
                // Reset form
                setFormData({
                    title: '',
                    content: '',
                    broadcastType: 'announcement',
                    targetAudience: 'opt_in_only',
                    channels: ['whatsapp'],
                    scheduleTime: null,
                    minOrderValue: 0,
                    maxOrderValue: null,
                    lastOrderWithinDays: 30,
                    branches: []
                });
                
                // Refresh broadcasts list
                setTimeout(() => {
                    fetchBroadcasts();
                    setShowForm(false);
                }, 2000);
            } else {
                setStatus({
                    type: 'error',
                    text: res.data.error || 'Failed to send broadcast'
                });
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            setStatus({
                type: 'error',
                text: error.response?.data?.error || 'Failed to send broadcast'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (broadcastId) => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/broadcast/logs/${broadcastId}`);
            setSelectedBroadcast(res.data.data);
        } catch (error) {
            console.error('Error fetching broadcast details:', error);
        }
    };

    const handleCancel = async (broadcastId) => {
        if (!window.confirm('Are you sure you want to cancel this broadcast?')) return;

        try {
            setLoading(true);
            const res = await axios.put(`${API_URL}/api/admin/broadcast/${broadcastId}/cancel`);
            if (res.data.success) {
                setStatus({ type: 'success', text: 'Broadcast cancelled successfully' });
                fetchBroadcasts();
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'Failed to cancel broadcast' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-blue-100 text-blue-800',
            sending: 'bg-yellow-100 text-yellow-800',
            sent: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-600'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getBroadcastTypeIcon = (type) => {
        const icons = {
            offer: Gift,
            announcement: Megaphone,
            event: Calendar,
            menu_launch: MessageSquare
        };
        const Icon = icons[type] || MessageSquare;
        return <Icon className="w-4 h-4" />;
    };

    if (selectedBroadcast) {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedBroadcast(null)}
                    className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                    ← Back to List
                </button>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedBroadcast.title}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {selectedBroadcast.broadcastType.replace('_', ' ')} • {new Date(selectedBroadcast.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBroadcast.status)}`}>
                            {selectedBroadcast.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Message Content</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedBroadcast.content}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold mb-1">TOTAL RECIPIENTS</p>
                            <p className="text-2xl font-bold text-blue-900">{selectedBroadcast.stats?.totalRecipients || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-semibold mb-1">SENT</p>
                            <p className="text-2xl font-bold text-green-900">{selectedBroadcast.stats?.sent || 0}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-xs text-red-600 font-semibold mb-1">FAILED</p>
                            <p className="text-2xl font-bold text-red-900">{selectedBroadcast.stats?.failed || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-xs text-purple-600 font-semibold mb-1">DELIVERY RATE</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {selectedBroadcast.stats?.totalRecipients ? 
                                    Math.round((selectedBroadcast.stats.sent / selectedBroadcast.stats.totalRecipients) * 100) : 0}%
                            </p>
                        </div>
                    </div>

                    {selectedBroadcast.errors && selectedBroadcast.errors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" /> Failed Deliveries ({selectedBroadcast.errors.length})
                            </h3>
                            <div className="max-h-48 overflow-y-auto text-sm">
                                {selectedBroadcast.errors.map((error, idx) => (
                                    <div key={idx} className="py-1 text-red-700 border-b border-red-200 last:border-b-0">
                                        {error.phone}: {error.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {(selectedBroadcast.status === 'draft' || selectedBroadcast.status === 'scheduled') && (
                            <button
                                onClick={() => handleCancel(selectedBroadcast._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                Cancel Broadcast
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-8 h-8 text-blue-600" />
                        Customer Broadcasting
                    </h1>
                    <p className="text-gray-500 mt-1">Send offers, announcements, events, and menu launches to opted-in customers</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                    <Send className="w-4 h-4" />
                    New Broadcast
                </button>
            </div>

            {/* Status Messages */}
            {status && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                    status.type === 'success' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                }`}>
                    {status.type === 'success' ? (
                        <CheckCircle className={`w-5 h-5 ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {status.text}
                    </span>
                </div>
            )}

            {/* New Broadcast Form */}
            {showForm && (
                <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Broadcast</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Broadcast Title <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Weekend Special Offer"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Broadcast Type <span className="text-red-600">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {broadcastTypes.map(type => {
                                        const IconComponent = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, broadcastType: type.value }))}
                                                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                                                    formData.broadcastType === type.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span className="text-xs font-medium">{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Message Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message Content <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Write your broadcast message here..."
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Characters: {formData.content.length} (WhatsApp limit: 1024)
                            </p>
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <span>Target Audience <span className="text-red-600">*</span></span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {audienceOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, targetAudience: option.value }))}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                            formData.targetAudience === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                                        <p className="text-xs text-gray-600">{option.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Audience Filters */}
                        {formData.targetAudience !== 'opt_in_only' && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                                <h3 className="font-semibold text-gray-900 text-sm">Filter Options</h3>
                                
                                {formData.targetAudience === 'vip_customers' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Minimum Order Value (₹)
                                            </label>
                                            <input
                                                type="number"
                                                name="minOrderValue"
                                                value={formData.minOrderValue}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Maximum Order Value (₹)
                                            </label>
                                            <input
                                                type="number"
                                                name="maxOrderValue"
                                                value={formData.maxOrderValue}
                                                onChange={handleInputChange}
                                                placeholder="No limit"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.targetAudience === 'recent_customers' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Last Order Within (days)
                                        </label>
                                        <input
                                            type="number"
                                            name="lastOrderWithinDays"
                                            value={formData.lastOrderWithinDays}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Channels */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Communication Channels <span className="text-red-600">*</span>
                            </label>
                            <div className="flex gap-4">
                                {channels.map(channel => (
                                    <label key={channel.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.channels.includes(channel.value)}
                                            onChange={() => handleChannelToggle(channel.value)}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{channel.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Branches */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Branches
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {branches.map(branch => (
                                    <label key={branch._id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={formData.branches.includes(branch._id)}
                                            onChange={() => handleBranchToggle(branch._id)}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700">{branch.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Schedule */}
                        <div>
                            <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                                <CalendarClock className="w-4 h-4" />
                                <span>Schedule for Later (Optional)</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="scheduleTime"
                                value={formData.scheduleTime}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {loading ? 'Sending...' : 'Send Broadcast'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Statistics */}
            {stats && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        30-Day Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold mb-1">TOTAL BROADCASTS</p>
                            <p className="text-3xl font-bold text-blue-900">{stats.overall?.totalBroadcasts || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-xs text-green-600 font-semibold mb-1">TOTAL SENT</p>
                            <p className="text-3xl font-bold text-green-900">{stats.overall?.totalSent || 0}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-xs text-red-600 font-semibold mb-1">TOTAL FAILED</p>
                            <p className="text-3xl font-bold text-red-900">{stats.overall?.totalFailed || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-xs text-purple-600 font-semibold mb-1">SUCCESS RATE</p>
                            <p className="text-3xl font-bold text-purple-900">
                                {stats.overall?.totalSent && stats.overall?.totalSent + stats.overall?.totalFailed > 0 ? 
                                    Math.round((stats.overall.totalSent / (stats.overall.totalSent + stats.overall.totalFailed)) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcasts List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Recent Broadcasts</h2>
                </div>

                {loading && broadcasts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Loading broadcasts...
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No broadcasts yet. Create one to get started!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Recipients</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Delivered</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {broadcasts.map((broadcast) => (
                                    <tr key={broadcast._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{broadcast.title}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                {getBroadcastTypeIcon(broadcast.broadcastType)}
                                                {broadcast.broadcastType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(broadcast.status)}`}>
                                                {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-medium">{broadcast.stats?.totalRecipients || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                {broadcast.stats?.sent || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(broadcast.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleViewDetails(broadcast._id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
