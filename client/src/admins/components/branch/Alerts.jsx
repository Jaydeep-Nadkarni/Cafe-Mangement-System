import React from 'react';
import { Bell } from 'lucide-react';

export default function Alerts() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <Bell className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Alerts & Notifications</h2>
      <p>Coming soon: Low stock alerts and system notifications.</p>
    </div>
  );
}
