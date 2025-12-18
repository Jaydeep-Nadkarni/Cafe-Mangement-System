import React from 'react';

/**
 * Loading skeleton for box plot visualizations
 * @param {Object} props - Component props
 * @param {number} props.boxes - Number of box plots to show
 * @param {number} props.height - Chart height in pixels
 */
const SkeletonBoxPlot = ({ boxes = 5, height = 350 }) => {
  return (
    <div className="w-full rounded-lg bg-white p-4 border border-gray-200">
      {/* Title */}
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>

      {/* Box Plot Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-full animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Box plots */}
        <div className="ml-14 h-full flex items-end gap-4 px-4 pb-8">
          {Array.from({ length: boxes }, (_, i) => {
            // Random heights for visual variety
            const min = 10 + Math.random() * 15;
            const q1 = 30 + Math.random() * 10;
            const median = 50 + Math.random() * 10;
            const q3 = 65 + Math.random() * 10;
            const max = 85 + Math.random() * 10;

            return (
              <div key={i} className="flex-1 relative h-full flex flex-col justify-end items-center">
                {/* Whisker top */}
                <div
                  className="w-px bg-gray-300 animate-pulse"
                  style={{
                    height: `${max - q3}%`,
                    animationDelay: `${i * 150}ms`
                  }}
                />
                
                {/* Max cap */}
                <div
                  className="w-1/2 h-0.5 bg-gray-300 animate-pulse"
                  style={{ animationDelay: `${i * 150 + 50}ms` }}
                />

                {/* Upper whisker */}
                <div
                  className="w-px bg-gray-300 animate-pulse"
                  style={{
                    height: `${q3 - median}%`,
                    animationDelay: `${i * 150 + 100}ms`
                  }}
                />

                {/* Box (Q1 to Q3) */}
                <div
                  className="w-full bg-gray-200 rounded animate-pulse relative"
                  style={{
                    height: `${q3 - q1}%`,
                    animationDelay: `${i * 150 + 150}ms`
                  }}
                >
                  {/* Median line */}
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gray-400 animate-pulse"
                    style={{
                      top: `${((median - q1) / (q3 - q1)) * 100}%`,
                      animationDelay: `${i * 150 + 200}ms`
                    }}
                  />
                </div>

                {/* Lower whisker */}
                <div
                  className="w-px bg-gray-300 animate-pulse"
                  style={{
                    height: `${q1 - min}%`,
                    animationDelay: `${i * 150 + 250}ms`
                  }}
                />

                {/* Min cap */}
                <div
                  className="w-1/2 h-0.5 bg-gray-300 animate-pulse"
                  style={{ animationDelay: `${i * 150 + 300}ms` }}
                />

                {/* Outliers */}
                {Math.random() > 0.5 && (
                  <div
                    className="absolute w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                    style={{
                      top: `${Math.random() * 10}%`,
                      animationDelay: `${i * 150 + 350}ms`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 absolute bottom-0 left-0 right-0 flex justify-between gap-4 px-4">
          {Array.from({ length: boxes }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-3 bg-gray-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Statistics Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs">
        {['Min', 'Q1', 'Median', 'Q3', 'Max'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonBoxPlot;
