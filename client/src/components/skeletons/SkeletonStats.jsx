import React from 'react';

export default function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
