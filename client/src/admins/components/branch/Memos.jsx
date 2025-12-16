import React from 'react';
import { StickyNote } from 'lucide-react';

export default function Memos() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <StickyNote className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Memos</h2>
      <p>Coming soon: Internal communication and announcements.</p>
    </div>
  );
}
