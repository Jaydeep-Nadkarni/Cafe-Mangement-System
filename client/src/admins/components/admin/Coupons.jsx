import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    Trash2,
    Edit,
    Search,
    Filter,
    Download,
    Tag,
    Calendar,
    DollarSign,
    Percent,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatCurrency';

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        couponType: 'simple',
        discountType: 'percentage',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderAmount: '',
        usageLimit: '',
        usagePerDay: '',
        usagePerTable: false,
        validFrom: '',
        validUntil: '',
        // Buy X Get Y
        buyXGetYRules: {
            enabled: false,
            itemId: '',
            itemName: '',
            quantity: '',
            freeQuantity: ''
        },
        // Quantity flat discount
        quantityRules: {
            enabled: false,
            minQuantity: '',
            flatDiscount: ''
        },
        // Category discount
        categoryRules: {
            enabled: false,
            categoryIds: [],
            categoryNames: [],
            discountPercent: ''
        },
        applicableBranches: [],
        notes: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchCoupons();
        fetchBranches();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/admin/coupons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/admin/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData };
            if (payload.applicableBranches.includes('all')) {
                payload.applicableBranches = [];
            }

            await axios.post(`${API_URL}/api/admin/coupons`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchCoupons();
            resetForm();
        } catch (error) {
            console.error('Error creating coupon:', error);
            alert('Failed to create coupon: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/admin/coupons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(coupons.filter(c => c._id !== id));
        } catch (error) {
            console.error('Error deleting coupon:', error);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/admin/coupons/${id}`,
                { isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            couponType: 'simple',
            discountType: 'percentage',
            discountValue: '',
            maxDiscountAmount: '',
            minOrderAmount: '',
            usageLimit: '',
            usagePerDay: '',
            usagePerTable: false,
            validFrom: '',
            validUntil: '',
            buyXGetYRules: {
                enabled: false,
                itemId: '',
                itemName: '',
                quantity: '',
                freeQuantity: ''
            },
            quantityRules: {
                enabled: false,
                minQuantity: '',
                flatDiscount: ''
            },
            categoryRules: {
                enabled: false,
                categoryIds: [],
                categoryNames: [],
                discountPercent: ''
            },
            applicableBranches: [],
            notes: ''
        });
    };

    const filteredCoupons = coupons.filter(coupon => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && coupon.isActive) ||
            (statusFilter === 'inactive' && !coupon.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-gray-700" />
                        Coupon Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for your branches</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Coupon
                </button>
            </div>

            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by code or description..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-medium">Code / Type</th>
                            <th className="px-6 py-4 font-medium">Discount</th>
                            <th className="px-6 py-4 font-medium">Validity</th>
                            <th className="px-6 py-4 font-medium">Usage / Daily</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading coupons...</td>
                            </tr>
                        ) : filteredCoupons.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No coupons found matching your criteria.</td>
                            </tr>
                        ) : filteredCoupons.map((coupon) => (
                            <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 bg-gray-100 inline-block px-2 py-1 rounded text-sm font-mono">{coupon.code}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs capitalize">
                                            {coupon.couponType || 'simple'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-sm font-medium text-green-700">
                                        {coupon.discountType === 'percentage' ? <Percent className="w-3 h-3 mr-1" /> : <DollarSign className="w-3 h-3 mr-1" />}
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                    </div>
                                    {coupon.minOrderAmount > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">Min: ₹{coupon.minOrderAmount}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">From: {formatDate(coupon.validFrom)}</span>
                                        <span className="text-xs text-gray-400">Until: {formatDate(coupon.validUntil)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">{coupon.usageCount || 0}</span>
                                        <span className="text-gray-400">/ {coupon.usageLimit ? coupon.usageLimit : '∞'}</span>
                                    </div>
                                    {coupon.usagePerDay && (
                                        <div className="text-xs text-gray-400 mt-1">Daily: {coupon.usagePerDay}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                                            className={`p-1 rounded hover:bg-gray-100 ${coupon.isActive ? 'text-red-500' : 'text-green-500'}`}
                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {coupon.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon._id)}
                                            className="p-1 text-red-500 rounded hover:bg-gray-100 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-xl font-bold text-gray-900">Create Advanced Coupon</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Tag className="w-5 h-5" /> Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border rounded-lg p-2 uppercase font-mono"
                                            placeholder="e.g. SUMMER20"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg p-2"
                                            placeholder="e.g. Summer special offer"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Type */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Coupon Type</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { value: 'simple', label: 'Simple Discount' },
                                        { value: 'buy_get', label: 'Buy X Get Y' },
                                        { value: 'quantity_flat', label: 'Quantity Discount' },
                                        { value: 'category', label: 'Category Based' }
                                    ].map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, couponType: type.value })}
                                            className={`p-3 rounded-lg border-2 text-center transition ${formData.couponType === type.value
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="text-sm font-medium">{type.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Discount Settings */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" /> Discount Settings
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                        <select
                                            className="w-full border rounded-lg p-2"
                                            value={formData.discountType}
                                            onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full border rounded-lg p-2"
                                            placeholder={formData.discountType === 'percentage' ? "e.g. 20" : "e.g. 100"}
                                            value={formData.discountValue}
                                            onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                        />
                                    </div>
                                    {formData.discountType === 'percentage' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Cap</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full border rounded-lg p-2"
                                                placeholder="Leave empty for no cap"
                                                value={formData.maxDiscountAmount}
                                                onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Bill Amount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full border rounded-lg p-2"
                                            placeholder="0 for no minimum"
                                            value={formData.minOrderAmount}
                                            onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Rules */}
                            {formData.couponType === 'quantity_flat' && (
                                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                                    <h4 className="font-semibold text-gray-900">Quantity-Based Discount</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Items</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full border rounded-lg p-2"
                                                placeholder="e.g. 5"
                                                value={formData.quantityRules.minQuantity}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    quantityRules: { ...formData.quantityRules, minQuantity: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Flat Discount (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full border rounded-lg p-2"
                                                placeholder="e.g. 100"
                                                value={formData.quantityRules.flatDiscount}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    quantityRules: { ...formData.quantityRules, flatDiscount: e.target.value }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Usage Restrictions */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" /> Usage Restrictions
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full border rounded-lg p-2"
                                            placeholder="Leave empty for unlimited"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per Day</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full border rounded-lg p-2"
                                            placeholder="Leave empty for unlimited"
                                            value={formData.usagePerDay}
                                            onChange={e => setFormData({ ...formData, usagePerDay: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.usagePerTable}
                                        onChange={e => setFormData({ ...formData, usagePerTable: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Restrict: One use per table per day</span>
                                </label>
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Store className="w-5 h-5" /> Applicable Branches
                                </h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={formData.applicableBranches.length === 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, applicableBranches: [] });
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">All Branches</span>
                                    </label>
                                    {branches.map(branch => (
                                        <label key={branch._id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={formData.applicableBranches.includes(branch._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            applicableBranches: [...formData.applicableBranches, branch._id]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            applicableBranches: formData.applicableBranches.filter(id => id !== branch._id)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{branch.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Validity */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" /> Validity Period
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border rounded-lg p-2"
                                            value={formData.validFrom}
                                            onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border rounded-lg p-2"
                                            value={formData.validUntil}
                                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                                            min={formData.validFrom}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm"
                                >
                                    Create Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
