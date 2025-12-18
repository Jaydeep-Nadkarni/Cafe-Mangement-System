import React from 'react';

/**
 * Loading skeleton for scatter plot visualizations
 * @param {Object} props - Component props
 * @param {number} props.points - Number of data points
 * @param {number} props.height - Chart height in pixels
 */
const SkeletonScatter = ({ points = 20, height = 350 }) => {
  // Generate random scatter points
  const scatterPoints = Array.from({ length: points }, (_, i) => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 8 + Math.random() * 12
  }));

  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Title */}
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      {/* Scatter Plot Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-full animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Y-axis label */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center"
          style={{ width: height }}
        >
          <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse" style={{ animationDelay: '200ms' }} />
        </div>

        {/* Plot area */}
        <div className="ml-14 mr-4 h-full pb-12 relative border-l-2 border-b-2 border-gray-200">
          {/* Grid lines */}
          {[20, 40, 60, 80].map((percent) => (
            <React.Fragment key={percent}>
              {/* Horizontal */}
              <div
                className="absolute left-0 right-0 h-px bg-gray-100"
                style={{ top: `${percent}%` }}
              />
              {/* Vertical */}
              <div
                className="absolute top-0 bottom-0 w-px bg-gray-100"
                style={{ left: `${percent}%` }}
              />
            </React.Fragment>
          ))}

          {/* Scatter points */}
          {scatterPoints.map((point, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gray-300 animate-pulse"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: `${point.size}px`,
                height: `${point.size}px`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 mr-4 absolute bottom-4 left-0 right-0 flex justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-12 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* X-axis label */}
        <div className="ml-14 mr-4 absolute -bottom-2 left-0 right-0 flex justify-center">
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="rounded-full bg-gray-200 animate-pulse"
              style={{
                width: `${10 + i * 3}px`,
                height: `${10 + i * 3}px`,
                animationDelay: `${i * 100}ms`
              }}
            />
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonScatter;
