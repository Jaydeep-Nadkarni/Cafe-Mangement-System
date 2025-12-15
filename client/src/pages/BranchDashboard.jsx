import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function BranchDashboard() {
  const { logout, user } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Branch Dashboard</h1>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
