import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, MapPin, Edit2, Trash2, X, Check, 
  AlertCircle, FileText, Clock, Printer, ArrowRightLeft, 
  Eye, ChevronDown, Search, LayoutGrid, List, Maximize2,
  QrCode, CalendarCheck, Move
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../../utils/formatCurrency';
import ConfirmationModal from './ConfirmationModal';
import Invoice from './Invoice';
import OrderManagement from './OrderManagement';
import OrderModal from './OrderModal';

const getTimeSince = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${Math.floor(diffInHours / 24)}d`;
};

export default function Tables({ tables, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [moveKOT, setMoveKOT] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    tableNumber: '',
    reservedBy: '',
    reservedPhone: '',
    reservationTime: '',
    reservationNotes: ''
  });
  const [locations, setLocations] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderManagement, setShowOrderManagement] = useState(null);

  const branchId = tables?.[0]?.branch?._id || tables?.[0]?.branch || null;

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    isLoading: false,
    onConfirm: null
  });

  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: 'Indoor',
    notes: '',
    currentOccupancy: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load locations for suggestions
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branch/tables/locations`);
      setLocations(res.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      tableNumber: '',
      capacity: '',
      location: 'Indoor',
      notes: '',
      currentOccupancy: 0
    });
    setEditingTable(null);
  };

  const handleEdit = (e, table) => {
    e.stopPropagation();
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location || 'Indoor',
      notes: table.notes || '',
      currentOccupancy: table.currentOccupancy || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setModalState({
      isOpen: true,
      title: 'Delete Table',
      description: 'Are you sure you want to delete this table? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/api/branch/tables/${id}`);
          onRefresh();
          setModalState({ ...modalState, isOpen: false });
        } catch (error) {
          console.error('Failed to delete table:', error);
        }
      }
    });
  };

  const handleStatusChange = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await axios.put(`${API_URL}/api/branch/tables/${id}/status`, { status: newStatus });
      onRefresh();
      setSelectedTable(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTable) {
        await axios.put(`${API_URL}/api/branch/tables/${editingTable._id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/branch/tables`, formData);
      }
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to save table:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'occupied': return {
        card: 'bg-red-50 border-red-200 shadow-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-700'
      };
      case 'available': return {
        card: 'bg-slate-50 border-slate-200 shadow-slate-100',
        text: 'text-slate-700',
        dot: 'bg-slate-500',
        badge: 'bg-slate-100 text-slate-700'
      };
      case 'reserved': return {
        card: 'bg-amber-50 border-amber-200 shadow-amber-100',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700'
      };
      case 'paid': return {
        card: 'bg-emerald-50 border-emerald-200 shadow-emerald-100',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700'
      };
      case 'printed': return {
        card: 'bg-indigo-50 border-indigo-200 shadow-indigo-100',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-100 text-indigo-700'
      };
      default: return {
        card: 'bg-slate-50 border-slate-200 shadow-slate-100',
        text: 'text-slate-700',
        dot: 'bg-slate-500',
        badge: 'bg-slate-100 text-slate-700'
      };
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter(t => 
      t.tableNumber.toString().includes(searchQuery) || 
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tables, searchQuery]);

  const groupedTables = useMemo(() => {
    const groups = {};
    filteredTables.forEach(table => {
      const loc = table.location || 'Other';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(table);
    });
    return groups;
  }, [filteredTables]);

  const getTableOrderStats = (table) => {
    if (!table.currentOrders || table.currentOrders.length === 0) {
      return { count: 0, unpaidAmount: 0 };
    }
    const unpaidAmount = table.currentOrders
      .filter(o => o.paymentStatus === 'unpaid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return { count: table.currentOrders.length, unpaidAmount };
  };

  const handleViewBill = (e, table) => {
    e.stopPropagation();
    if (table.currentOrders && table.currentOrders.length > 0) {
      setShowInvoice(table.currentOrders[0]);
    }
  };

  const handleTableClick = (table) => {
    if (moveKOT) {
      // Logic for moving KOT
      alert(`Moving KOT for Table ${table.tableNumber}`);
    } else if (table.status !== 'available' && table.status !== 'maintenance') {
      setShowOrderManagement(table);
    } else {
      setSelectedTable(table);
    }
  };

  return (
    <div className="h-full bg-slate-50/50 p-4 md:p-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowReservationModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-100 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Reservation</span>
            </button>
            <button 
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Contactless</span>
            </button>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>

          {/* Right: Controls */}
          <div className="flex flex-wrap items-center gap-6">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>

            {/* Move KOT Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm font-bold text-slate-600">Move KOT</span>
              <button 
                onClick={() => setMoveKOT(!moveKOT)}
                className={`relative w-11 h-6 rounded-full transition-colors ${moveKOT ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${moveKOT ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Compact View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-100">
          {[
            { label: 'Available', color: 'bg-slate-500' },
            { label: 'Occupied', color: 'bg-red-500' },
            { label: 'Reserved', color: 'bg-amber-500' },
            { label: 'Printed', color: 'bg-indigo-500' },
            { label: 'Paid', color: 'bg-emerald-500' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table Sections */}
      <div className="space-y-12 pb-20">
        {Object.entries(groupedTables).map(([location, locationTables]) => (
          locationTables.length > 0 && (
            <div key={location} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{location}</h3>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{locationTables.length} Tables</span>
              </div>

              <div className={`
                ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6' : ''}
                ${viewMode === 'compact' ? 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3' : ''}
                ${viewMode === 'list' ? 'flex flex-col gap-3' : ''}
              `}>
                {locationTables.map(table => {
                  const styles = getStatusStyles(table.status);
                  const stats = getTableOrderStats(table);
                  const isOccupied = table.status !== 'available' && table.status !== 'maintenance';

                  if (viewMode === 'list') {
                    return (
                      <div 
                        key={table._id}
                        onClick={() => handleTableClick(table)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md ${styles.card}`}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                            <span className="text-xl font-black text-slate-800">{table.tableNumber}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">Capacity: {table.capacity}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles.badge}`}>
                                {table.status}
                              </span>
                            </div>
                            {table.notes && <p className="text-xs text-slate-500 mt-0.5">{table.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          {isOccupied && (
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase">Unpaid</p>
                              <p className="text-sm font-black text-rose-600">{formatCurrency(stats.unpaidAmount)}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={(e) => handleEdit(e, table)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => handleDelete(e, table._id)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={table._id}
                      onClick={() => handleTableClick(table)}
                      className={`
                        relative rounded-2xl border-2 transition-all cursor-pointer group
                        ${viewMode === 'grid' ? 'aspect-square p-4 flex flex-col items-center justify-center' : 'p-2 flex flex-col items-center justify-center'}
                        ${styles.card} hover:scale-105 hover:shadow-xl active:scale-95
                      `}
                    >
                      {/* Status Dot */}
                      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${styles.dot} shadow-sm`} />

                      <span className={`font-black text-slate-800 ${viewMode === 'grid' ? 'text-3xl' : 'text-lg'}`}>
                        {table.tableNumber}
                      </span>

                      {viewMode === 'grid' && isOccupied && (
                        <div className="mt-2 flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {formatCurrency(stats.unpaidAmount)}
                          </span>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                            <Clock className="w-3 h-3" />
                            {getTimeSince(table.currentOrders?.[0]?.createdAt)}
                          </div>
                        </div>
                      )}

                      {/* Hover Actions (Grid Only) */}
                      {viewMode === 'grid' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex items-center justify-center gap-3">
                          {/* Print Bill - Only for occupied tables */}
                          {isOccupied && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleViewBill(e, table); }}
                              className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                              title="Print Bill"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {/* View Order - Only for occupied tables */}
                          {isOccupied && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowOrderManagement(table); }}
                              className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
                              title="View Order"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {/* Create Order - Only for available tables */}
                          {!isOccupied && table.status !== 'reserved' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowOrderManagement(table); }}
                              className="p-2.5 bg-emerald-500 rounded-xl shadow-lg text-white hover:bg-emerald-600 transition-colors"
                              title="Create Order"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          {/* Edit Table - Always shown */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(e, table); }}
                            className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-amber-600 transition-colors"
                            title="Edit Table"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">New Reservation</h2>
              </div>
              <button onClick={() => setShowReservationModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const table = tables.find(t => t.tableNumber === parseInt(reservationForm.tableNumber));
                if (!table) {
                  alert('Table not found');
                  return;
                }
                await axios.put(`${API_URL}/api/branch/tables/${table._id}`, {
                  status: 'reserved',
                  reservation: {
                    isReserved: true,
                    reservedBy: reservationForm.reservedBy,
                    reservedPhone: reservationForm.reservedPhone,
                    reservationTime: reservationForm.reservationTime,
                    reservationNotes: reservationForm.reservationNotes
                  }
                });
                setShowReservationModal(false);
                setReservationForm({ tableNumber: '', reservedBy: '', reservedPhone: '', reservationTime: '', reservationNotes: '' });
                onRefresh();
              } catch (error) {
                console.error('Failed to reserve table:', error);
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Table No.</label>
                  <input
                    required
                    type="number"
                    value={reservationForm.tableNumber}
                    onChange={(e) => setReservationForm({ ...reservationForm, tableNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={reservationForm.reservationTime}
                    onChange={(e) => setReservationForm({ ...reservationForm, reservationTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                <input
                  required
                  type="text"
                  value={reservationForm.reservedBy}
                  onChange={(e) => setReservationForm({ ...reservationForm, reservedBy: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={reservationForm.reservedPhone}
                  onChange={(e) => setReservationForm({ ...reservationForm, reservedPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea
                  rows="2"
                  value={reservationForm.reservationNotes}
                  onChange={(e) => setReservationForm({ ...reservationForm, reservationNotes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-500 outline-none font-bold text-slate-800 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal (Dummy) */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl">
                  <QrCode className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Contactless Menu</h2>
              </div>
              <button onClick={() => setShowQRModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                <QRCodeSVG value="https://cafe-menu.example.com" size={200} />
              </div>
              <p className="text-center text-slate-500 font-medium px-4">Scan this QR code to access the digital menu and place orders directly from your table.</p>
              <button 
                onClick={() => setShowQRModal(false)}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowInvoice(null)}
              className="absolute -top-14 right-0 p-3 text-white hover:text-slate-200 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="p-6">
              <Invoice 
                order={showInvoice} 
                branchName={localStorage.getItem('branchName')} 
                billerName={localStorage.getItem('userName')}
              />
              <div className="mt-8 flex gap-4 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button 
                  onClick={() => setShowInvoice(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {selectedTable && !showInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={() => setSelectedTable(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <span className="text-2xl font-black text-slate-800">{selectedTable.tableNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Table Details</h2>
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusStyles(selectedTable.status).dot}`} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedTable.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => { setShowOrderManagement(selectedTable); setSelectedTable(null); }}
                  className="flex items-center justify-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 font-black transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Create Order
                </button>
                <button 
                  onClick={(e) => handleViewBill(e, selectedTable)}
                  className="flex items-center justify-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 font-black transition-all active:scale-95"
                >
                  <FileText className="w-5 h-5" /> View Order
                </button>
                <button className="flex items-center justify-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-2xl hover:bg-purple-100 font-black transition-all active:scale-95">
                  <ArrowRightLeft className="w-5 h-5" /> Merge
                </button>
                <button
                  onClick={(e) => { handleEdit(e, selectedTable); setSelectedTable(null); }}
                  className="flex items-center justify-center gap-3 p-4 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 font-black transition-all active:scale-95"
                >
                  <Edit2 className="w-5 h-5" /> Edit
                </button>
                <button
                  onClick={(e) => { handleDelete(e, selectedTable._id); setSelectedTable(null); }}
                  className="flex items-center justify-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl hover:bg-rose-100 font-black transition-all active:scale-95"
                >
                  <Trash2 className="w-5 h-5" /> Delete
                </button>
              </div>

              {/* Status Management */}
              <div className="mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Update Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['available', 'occupied', 'reserved', 'paid', 'printed', 'maintenance'].map(status => (
                    <button
                      key={status}
                      disabled={selectedTable.status === status}
                      onClick={(e) => handleStatusChange(e, selectedTable._id, status)}
                      className={`py-3 px-2 text-[10px] font-black rounded-xl uppercase tracking-wider border-2 transition-all ${
                        selectedTable.status === status
                          ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200'
                          : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Order Summary & Items */}
              {selectedTable.currentOrders && selectedTable.currentOrders.length > 0 && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">Active Session</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500">Total Orders</span>
                      <span className="text-sm font-black text-slate-800">{selectedTable.currentOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <span className="text-sm font-bold text-slate-500">Unpaid Balance</span>
                      <span className="text-lg font-black text-rose-600">
                        {formatCurrency(
                          selectedTable.currentOrders.reduce((sum, o) => sum + (o.paymentStatus !== 'paid' ? o.total : 0), 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Clickable Order Items */}
                  <div className="space-y-2 border-t border-slate-200 pt-4">
                    {selectedTable.currentOrders.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => {
                          setSelectedOrderForModal(order);
                          setShowOrderModal(true);
                        }}
                        className="w-full text-left p-3 bg-white rounded-xl hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-wide">Order #{order.orderNumber || order._id.slice(-6)}</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{order.items?.length || 0} items</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {order.paymentStatus}
                            </div>
                            <div className="text-sm font-black text-slate-800 mt-1">{formatCurrency(order.total)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{editingTable ? 'Edit Table' : 'New Table'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Table No.</label>
                  <input
                    required
                    type="number"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                  <input
                    required
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <input
                  list="locations-list"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-800"
                  placeholder="e.g. Indoor, Outdoor, Rooftop..."
                />
                <datalist id="locations-list">
                  {locations.map(loc => <option key={loc} value={loc} />)}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Near window, VIP area..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-800 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95"
                >
                  {loading ? 'Saving...' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDangerous={modalState.isDangerous}
        isLoading={modalState.isLoading}
      />

      {/* Order Management Modal */}
      {showOrderManagement && (
        <OrderManagement 
          table={showOrderManagement} 
          onClose={() => setShowOrderManagement(null)} 
          onRefresh={onRefresh}
        />
      )}

      {/* Order Modal - Clickable from table orders */}
      {showOrderModal && selectedOrderForModal && (
        <OrderModal 
          isOpen={showOrderModal}
          order={selectedOrderForModal}
          branchId={branchId}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrderForModal(null);
          }}
          onUpdate={() => {
            setShowOrderModal(false);
            setSelectedOrderForModal(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
