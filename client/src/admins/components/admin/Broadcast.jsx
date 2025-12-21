import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Send,
    MessageSquare,
    Users,
    CheckCircle,
    AlertCircle,
    Clock,
    Check
} from 'lucide-react';

export default function Broadcast() {
    const [branches, setBranches] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]); // 'all' or array of IDs
    const [message, setMessage] = useState({ title: '', content: '', priority: 'medium' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '' }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/branches`);
            setBranches(res.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBranches('all');
        } else {
            setSelectedBranches([]);
        }
    };

    const handleSelectBranch = (id) => {
        if (selectedBranches === 'all') {
            // If unchecking one, switch to array of all others
            const allIds = branches.map(b => b._id);
            setSelectedBranches(allIds.filter(bid => bid !== id));
        } else {
            if (selectedBranches.includes(id)) {
                setSelectedBranches(selectedBranches.filter(bid => bid !== id));
            } else {
                setSelectedBranches([...selectedBranches, id]);
            }
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (selectedBranches.length === 0 && selectedBranches !== 'all') {
            setStatus({ type: 'error', text: 'Please select at least one branch.' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const targetBranchIds = selectedBranches === 'all'
                ? branches.map(b => b._id)
                : selectedBranches;

            // In a real app, backend should handle broadcast. Here we loop.
            const promises = targetBranchIds.map(branchId =>
                axios.post(`${API_URL}/api/admin/memos`, {
                    branch: branchId,
                    ...message
                })
            );

            await Promise.all(promises);

            setStatus({ type: 'success', text: `Message successfully sent to ${targetBranchIds.length} branch(es).` });
            setMessage({ title: '', content: '', priority: 'medium' });
            setSelectedBranches([]);
        } catch (error) {
            console.error('Broadcast error:', error);
            setStatus({ type: 'error', text: 'Failed to send messages. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full max-w-4xl mx-auto">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Broadcast Message
                </h2>
                <p className="text-sm text-gray-500 mt-1">Send announcements or instructions to multiple branches at once.</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <form onSubmit={handleSend} className="space-y-6">

                    {/* Branch Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Recipients</label>
                        <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                            <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                                <input
                                    type="checkbox"
                                    id="select-all"
                                    checked={selectedBranches === 'all' || (Array.isArray(selectedBranches) && selectedBranches.length === branches.length && branches.length > 0)}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="select-all" className="ml-2 text-sm font-bold text-gray-900 cursor-pointer">
                                    Select All Branches ({branches.length})
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {branches.map(branch => (
                                    <div key={branch._id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`branch-${branch._id}`}
                                            checked={selectedBranches === 'all' || selectedBranches.includes(branch._id)}
                                            onChange={() => handleSelectBranch(branch._id)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`branch-${branch._id}`} className="ml-2 text-sm text-gray-700 cursor-pointer truncate">
                                            {branch.name} <span className="text-gray-400 text-xs">({branch.branchCode})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 text-right">
                            Selected: {selectedBranches === 'all' ? branches.length : selectedBranches.length}
                        </p>
                    </div>

                    {/* Message Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Holiday Operating Hours"
                                    value={message.title}
                                    onChange={e => setMessage({ ...message, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={message.priority}
                                    onChange={e => setMessage({ ...message, priority: e.target.value })}
                                >
                                    <option value="low">Low (Info)</option>
                                    <option value="medium">Medium (Standard)</option>
                                    <option value="high">High (Urgent)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                            <textarea
                                required
                                rows="6"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Type your announcement here..."
                                value={message.content}
                                onChange={e => setMessage({ ...message, content: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="font-medium">{status.text}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
