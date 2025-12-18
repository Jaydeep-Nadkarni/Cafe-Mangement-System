import React from 'react';

/**
 * Loading skeleton for pie and donut charts
 * @param {Object} props - Component props
 * @param {number} props.size - Chart diameter in pixels
 * @param {boolean} props.donut - Whether to show donut style
 */
const SkeletonPieChart = ({ size = 280, donut = false }) => {
  const segments = [
    { start: 0, end: 35, color: 'bg-gray-300' },
    { start: 35, end: 60, color: 'bg-gray-200' },
    { start: 60, end: 80, color: 'bg-gray-400' },
    { start: 80, end: 100, color: 'bg-gray-250' }
  ];

  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Title */}
      <div className="mb-6">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Pie/Donut Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full bg-gray-200 animate-pulse" />
          
          {/* Segment overlays */}
          {segments.map((segment, i) => (
            <div
              key={i}
              className={`absolute inset-0 rounded-full ${segment.color} animate-pulse`}
              style={{
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((segment.start / 100) * 2 * Math.PI - Math.PI / 2)}% ${50 + 50 * Math.sin((segment.start / 100) * 2 * Math.PI - Math.PI / 2)}%, ${50 + 50 * Math.cos((segment.end / 100) * 2 * Math.PI - Math.PI / 2)}% ${50 + 50 * Math.sin((segment.end / 100) * 2 * Math.PI - Math.PI / 2)}%)`,
                animationDelay: `${i * 150}ms`
              }}
            />
          ))}

          {/* Donut hole */}
          {donut && (
            <div className="absolute inset-[30%] rounded-full bg-white" />
          )}
          
          {/* Center value for donut */}
          {donut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-6 bg-gray-300 rounded w-16 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-1 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                <div className="h-2 bg-gray-100 rounded w-2/3 animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonPieChart;
