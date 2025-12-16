import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <SettingsIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Branch Settings</h2>
      <p>Coming soon: Configure branch details, hours, and preferences.</p>
    </div>
  );
}
