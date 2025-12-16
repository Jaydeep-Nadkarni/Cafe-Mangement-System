import React from 'react';

export default function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
          <div className="h-16 w-16 bg-gray-200 rounded-lg shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
