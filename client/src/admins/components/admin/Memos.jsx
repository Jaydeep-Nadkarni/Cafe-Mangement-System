import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Memos() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/memos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemos(response.data.memos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching memos:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Memos</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600 text-center py-8">Memos management coming soon</p>
      </div>
    </div>
  );
}
