import React from 'react';

/**
 * Generic loading skeleton for bar, line, and area charts
 * @param {Object} props - Component props
 * @param {string} props.type - Chart type ('bar', 'line', 'area')
 * @param {number} props.height - Chart height in pixels
 * @param {number} props.bars - Number of bars/points to show
 */
const SkeletonChart = ({ type = 'bar', height = 300, bars = 8 }) => {
  const generateBars = () => {
    return Array.from({ length: bars }, (_, i) => {
      const heightPercent = 30 + (Math.random() * 60); // 30-90% height
      return (
        <div
          key={i}
          className="flex-1 mx-1 bg-gray-200 rounded-t animate-pulse"
          style={{
            height: `${heightPercent}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      );
    });
  };

  const generateLinePoints = () => {
    return Array.from({ length: bars }, (_, i) => {
      const yPercent = 20 + (Math.random() * 60); // 20-80% position
      return (
        <div
          key={i}
          className="absolute w-3 h-3 bg-gray-300 rounded-full animate-pulse"
          style={{
            left: `${(i / (bars - 1)) * 90 + 5}%`,
            top: `${yPercent}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      );
    });
  };

  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Chart Title Skeleton */}
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-full animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Chart Content */}
        <div className="ml-14 h-full relative">
          {type === 'bar' && (
            <div className="flex items-end h-full px-2">
              {generateBars()}
            </div>
          )}

          {type === 'line' && (
            <>
              {/* Line path */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <path
                  d={`M 5% 50% Q 30% 30%, 50% 40% T 95% 60%`}
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  fill="none"
                  className="animate-pulse"
                />
              </svg>
              {/* Data points */}
              {generateLinePoints()}
            </>
          )}

          {type === 'area' && (
            <div className="relative h-full">
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <path
                  d={`M 5% 80% Q 30% 40%, 50% 50% T 95% 70% L 95% 100% L 5% 100% Z`}
                  fill="#D1D5DB"
                  className="animate-pulse"
                />
              </svg>
              {generateLinePoints()}
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 flex justify-between pt-2 px-2">
          {Array.from({ length: bars }, (_, i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded flex-1 mx-1 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Legend Skeleton */}
      <div className="mt-4 flex justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonChart;
