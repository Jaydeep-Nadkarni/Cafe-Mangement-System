import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, X, Trash2, Check, Eye, AlertCircle, Users } from 'lucide-react';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal';

export default function Memos({ branch }) {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReaders, setShowReaders] = useState(null);
  const [newMemo, setNewMemo] = useState({ title: '', content: '', priority: 'medium' });
  const [userRole, setUserRole] = useState('admin');
  const [userId, setUserId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    isDangerous: false,
    isLoading: false
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    const id = localStorage.getItem('userId');
    setUserRole(role);
    setUserId(id);
    fetchMemos();
  }, [branch]);

  const fetchMemos = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${API_URL}/api/admin/memos`, {
        params: { branch: branch?._id }
      });
      setMemos(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching memos:', error);
      setLoading(false);
    }
  };

  const createMemo = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${API_URL}/api/admin/memos`, {
        ...newMemo,
        branch: branch?._id
      });
      setMemos([res.data, ...memos]);
      setShowModal(false);
      setNewMemo({ title: '', content: '', priority: 'medium' });
    } catch (error) {
      console.error('Error creating memo:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to create memo. Please try again.',
        onConfirm: null,
        isDangerous: true
      });
    }
  };

  const acknowledgeMemo = async (id) => {
    setLoadingId(id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${API_URL}/api/admin/memos/${id}/acknowledge`);
      setMemos(memos.map(m => m._id === id ? res.data.memo : m));
    } catch (error) {
      console.error('Error acknowledging memo:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to acknowledge memo. Please try again.',
        onConfirm: null,
        isDangerous: true
      });
    } finally {
      setLoadingId(null);
    }
  };

  const markMemoAsRead = async (id) => {
    setLoadingId(id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${API_URL}/api/admin/memos/${id}/read`);
      setMemos(memos.map(m => m._id === id ? res.data.memo : m));
    } catch (error) {
      console.error('Error marking memo as read:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to mark memo as read. Please try again.',
        onConfirm: null,
        isDangerous: true
      });
    } finally {
      setLoadingId(null);
    }
  };

  const deleteMemo = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Archive Memo',
      description: 'Are you sure you want to archive this memo? This action cannot be undone.',
      isDangerous: true,
      isLoading: false,
      onConfirm: async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          await axios.delete(`${API_URL}/api/admin/memos/${id}`);
          setMemos(memos.filter(m => m._id !== id));
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          console.error('Error deleting memo:', error);
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            description: 'Failed to archive memo. Please try again.',
            onConfirm: null,
            isDangerous: true
          });
        }
      }
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'low': return 'bg-green-100 border-green-200 text-green-800';
      default: return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }
  };

  const getManagerReadStatus = (memo) => {
    if (!userId) return null;
    const read = memo.readByManagers.find(r => r.manager?._id === userId || r.manager === userId);
    return read;
  };

  const isAdminOnly = userRole === 'admin' || userRole === 'superadmin';

  if (loading) return <div className="p-4">Loading memos...</div>;

  return (
    <>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        isDangerous={confirmModal.isDangerous}
        isLoading={confirmModal.isLoading}
      />

      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Staff Memos</h2>
          {isAdminOnly && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Memo</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
          {memos.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">
              <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No memos found. Create one to communicate with staff.</p>
            </div>
          ) : (
            memos.map(memo => {
              const readStatus = getManagerReadStatus(memo);
              const isCreator = isAdminOnly && memo.createdBy?._id === userId;

              return (
                <div
                  key={memo._id}
                  className={`p-4 rounded-lg border shadow-sm relative group flex flex-col ${getPriorityColor(memo.priority)}`}
                >
                  {isAdminOnly && (
                    <button
                      onClick={() => deleteMemo(memo._id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <h3 className="font-bold text-lg mb-2 pr-6">{memo.title}</h3>
                  <p className="whitespace-pre-wrap text-sm mb-4 flex-1">{memo.content}</p>

                  {/* Admin View: Show read status */}
                  {isAdminOnly && memo.readByManagers.length > 0 && (
                    <div className="mb-3 pt-2 border-t border-current opacity-60">
                      <button
                        onClick={() => setShowReaders(showReaders === memo._id ? null : memo._id)}
                        className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                      >
                        <Users className="w-3 h-3" />
                        <span>{memo.readByManagers.length} read</span>
                      </button>

                      {showReaders === memo._id && (
                        <div className="mt-2 space-y-1 text-xs opacity-75">
                          {memo.readByManagers.map((reader, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span>{reader.manager?.username || 'Unknown'}</span>
                              <div className="flex items-center gap-1">
                                {reader.acknowledged && <Check className="w-3 h-3" />}
                                <span>{new Date(reader.readAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manager View: Show action buttons */}
                  {!isAdminOnly && (
                    <div className="flex items-center gap-2 pt-2 border-t border-current opacity-60">
                      {!readStatus && (
                        <button
                          onClick={() => markMemoAsRead(memo._id)}
                          disabled={loadingId === memo._id}
                          className="text-xs flex items-center gap-1 px-2 py-1 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark as read"
                        >
                          {loadingId === memo._id ? (
                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          <span>{loadingId === memo._id ? 'Reading...' : 'Read'}</span>
                        </button>
                      )}
                      {readStatus && !readStatus.acknowledged && (
                        <button
                          onClick={() => acknowledgeMemo(memo._id)}
                          disabled={loadingId === memo._id}
                          className="text-xs flex items-center gap-1 px-2 py-1 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Acknowledge memo"
                        >
                          {loadingId === memo._id ? (
                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>{loadingId === memo._id ? 'Acking...' : 'Acknowledge'}</span>
                        </button>
                      )}
                      {readStatus?.acknowledged && (
                        <div className="text-xs flex items-center gap-1 px-2 py-1 opacity-75">
                          <Check className="w-3 h-3" />
                          <span>Acknowledged</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs opacity-75 flex justify-between items-center mt-auto pt-2 mt-2">
                    <span>{new Date(memo.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="uppercase font-bold text-[10px] tracking-wider border px-1 rounded">
                      {memo.priority}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Memo Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create New Memo</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={createMemo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    value={newMemo.title}
                    onChange={e => setNewMemo({ ...newMemo, title: e.target.value })}
                    placeholder="e.g., Staff Meeting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    value={newMemo.priority}
                    onChange={e => setNewMemo({ ...newMemo, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    required
                    rows="4"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    value={newMemo.content}
                    onChange={e => setNewMemo({ ...newMemo, content: e.target.value })}
                    placeholder="Write your message here..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Memo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
