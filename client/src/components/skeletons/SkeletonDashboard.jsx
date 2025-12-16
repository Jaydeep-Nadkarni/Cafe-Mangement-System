import React from 'react';
import SkeletonStats from './SkeletonStats';
import SkeletonTable from './SkeletonTable';

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>

      {/* Stats */}
      <SkeletonStats />

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="h-8 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    </div>
  );
}
