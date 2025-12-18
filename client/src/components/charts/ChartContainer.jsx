import { useEffect, useState, useRef } from 'react';

export default function ChartContainer({ 
  children, 
  title, 
  subtitle,
  minHeight = 300,
  className = '' 
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = Math.max(minHeight, width * 0.6); // Maintain aspect ratio
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [minHeight]);

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-lg shadow p-4 ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div style={{ width: '100%', height: dimensions.height }}>
        {dimensions.width > 0 && children(dimensions)}
      </div>
    </div>
  );
}
