import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function Stats() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <BarChart2 className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Statistics & Analytics</h2>
      <p>Coming soon: Sales charts, peak hours, and popular items.</p>
    </div>
  );
}
