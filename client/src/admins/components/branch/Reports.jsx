import React from 'react';
import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Reports</h2>
      <p>Coming soon: Daily, weekly, and monthly sales reports.</p>
    </div>
  );
}
