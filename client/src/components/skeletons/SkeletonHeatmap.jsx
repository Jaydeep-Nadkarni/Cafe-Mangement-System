import React from 'react';

/**
 * Loading skeleton for heatmap visualizations
 * @param {Object} props - Component props
 * @param {number} props.rows - Number of rows
 * @param {number} props.cols - Number of columns
 * @param {number} props.height - Chart height in pixels
 */
const SkeletonHeatmap = ({ rows = 24, cols = 7, height = 400 }) => {
  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Title */}
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      {/* Heatmap Grid */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels (Hours/Rows) */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between py-2">
          {Array.from({ length: Math.min(rows, 8) }, (_, i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-full animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Grid cells */}
        <div className="ml-14 h-full flex flex-col gap-1 pb-8">
          {Array.from({ length: rows }, (_, rowIdx) => (
            <div key={rowIdx} className="flex-1 flex gap-1">
              {Array.from({ length: cols }, (_, colIdx) => {
                // Random intensity for visual variety
                const intensity = Math.floor(Math.random() * 4);
                const bgColor = ['bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400'][intensity];
                
                return (
                  <div
                    key={colIdx}
                    className={`flex-1 rounded ${bgColor} animate-pulse`}
                    style={{ animationDelay: `${(rowIdx * cols + colIdx) * 20}ms` }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* X-axis labels (Days/Columns) */}
        <div className="ml-14 absolute bottom-0 left-0 right-0 flex justify-between gap-1">
          {Array.from({ length: cols }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-4 bg-gray-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="text-xs text-gray-400 animate-pulse">Low</div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-12 h-6 bg-gray-200 rounded animate-pulse"
              style={{
                opacity: 0.3 + (i * 0.15),
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        <div className="text-xs text-gray-400 animate-pulse" style={{ animationDelay: '500ms' }}>High</div>
      </div>
    </div>
  );
};

export default SkeletonHeatmap;
