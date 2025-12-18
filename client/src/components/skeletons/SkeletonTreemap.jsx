import React from 'react';

/**
 * Loading skeleton for treemap visualizations
 * @param {Object} props - Component props
 * @param {number} props.height - Chart height in pixels
 */
const SkeletonTreemap = ({ height = 400 }) => {
  // Generate random treemap rectangles
  const rectangles = [
    { x: 0, y: 0, width: 45, height: 60, color: 'bg-gray-300' },
    { x: 45, y: 0, width: 30, height: 60, color: 'bg-gray-200' },
    { x: 75, y: 0, width: 25, height: 30, color: 'bg-gray-400' },
    { x: 75, y: 30, width: 25, height: 30, color: 'bg-gray-250' },
    { x: 0, y: 60, width: 35, height: 40, color: 'bg-gray-350' },
    { x: 35, y: 60, width: 40, height: 40, color: 'bg-gray-300' },
    { x: 75, y: 60, width: 25, height: 40, color: 'bg-gray-200' }
  ];

  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Title */}
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      {/* Treemap Container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden" style={{ height: `${height}px` }}>
        {rectangles.map((rect, i) => (
          <div
            key={i}
            className={`absolute ${rect.color} animate-pulse border-2 border-white flex flex-col justify-center items-center p-2`}
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`,
              animationDelay: `${i * 100}ms`
            }}
          >
            {/* Label skeleton */}
            <div className="h-3 bg-white/50 rounded w-3/4 mb-1 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            {/* Value skeleton */}
            <div className="h-4 bg-white/60 rounded w-1/2 animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonTreemap;
