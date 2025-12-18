import { useState, useEffect, useMemo } from 'react';
import { getFeature } from '../config/features';

/**
 * Custom hook for responsive chart behavior
 * Detects screen size and provides mobile-optimized chart configurations
 * 
 * @param {Array} data - Chart data array
 * @param {Object} options - Configuration options
 * @returns {Object} Responsive chart configuration
 */
const useResponsiveChart = (data, options = {}) => {
  const {
    mobileMaxPoints = getFeature('MOBILE_MAX_DATA_POINTS'),
    mobileBreakpoint = getFeature('MOBILE_BREAKPOINT'),
    enableMobileOptimization = getFeature('ENABLE_MOBILE_CHARTS')
  } = options;

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Update window size on resize
  useEffect(() => {
    let timeoutId = null;
    
    const handleResize = () => {
      // Debounce resize events
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine device type
  const isMobile = useMemo(() => {
    return windowSize.width < mobileBreakpoint;
  }, [windowSize.width, mobileBreakpoint]);

  const isTablet = useMemo(() => {
    return windowSize.width >= mobileBreakpoint && windowSize.width < 1024;
  }, [windowSize.width, mobileBreakpoint]);

  const isDesktop = useMemo(() => {
    return windowSize.width >= 1024;
  }, [windowSize.width]);

  // Calculate responsive data
  const responsiveData = useMemo(() => {
    if (!enableMobileOptimization || !isMobile || !data || data.length <= mobileMaxPoints) {
      return data;
    }

    // Reduce data points for mobile
    const step = Math.ceil(data.length / mobileMaxPoints);
    return data.filter((_, index) => index % step === 0);
  }, [data, isMobile, mobileMaxPoints, enableMobileOptimization]);

  // Responsive chart dimensions
  const chartHeight = useMemo(() => {
    if (isMobile) return 250;
    if (isTablet) return 300;
    return 350;
  }, [isMobile, isTablet]);

  const chartWidth = useMemo(() => {
    return windowSize.width - (isMobile ? 40 : isTablet ? 80 : 120);
  }, [windowSize.width, isMobile, isTablet]);

  // Responsive font sizes
  const fontSize = useMemo(() => {
    return {
      title: isMobile ? 16 : isTablet ? 18 : 20,
      label: isMobile ? 11 : isTablet ? 12 : 13,
      legend: isMobile ? 11 : isTablet ? 12 : 13,
      tooltip: isMobile ? 12 : 13,
      axis: isMobile ? 10 : isTablet ? 11 : 12
    };
  }, [isMobile, isTablet]);

  // Responsive margins
  const margins = useMemo(() => {
    return {
      top: isMobile ? 10 : isTablet ? 15 : 20,
      right: isMobile ? 10 : isTablet ? 15 : 20,
      bottom: isMobile ? 30 : isTablet ? 40 : 50,
      left: isMobile ? 40 : isTablet ? 50 : 60
    };
  }, [isMobile, isTablet]);

  // Responsive chart config
  const chartConfig = useMemo(() => {
    return {
      // Recharts specific
      barSize: isMobile ? 20 : isTablet ? 30 : 40,
      strokeWidth: isMobile ? 1.5 : 2,
      dotSize: isMobile ? 4 : 5,
      
      // Visx specific
      tickLabelAngle: isMobile ? -45 : 0,
      numTicks: isMobile ? 4 : isTablet ? 6 : 8,
      
      // General
      showGrid: !isMobile,
      showLegend: !isMobile || options.forceLegend,
      legendPosition: isMobile ? 'bottom' : 'right',
      tooltipMode: isMobile ? 'touch' : 'hover',
      animationDuration: isMobile ? 300 : 500,
      
      // Touch targets for mobile
      touchRadius: isMobile ? 24 : 16
    };
  }, [isMobile, isTablet, options.forceLegend]);

  // Simplified chart variant for mobile
  const shouldSimplify = useMemo(() => {
    return enableMobileOptimization && isMobile;
  }, [enableMobileOptimization, isMobile]);

  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    
    // Responsive data
    data: responsiveData,
    originalDataLength: data?.length || 0,
    isDataReduced: responsiveData?.length < (data?.length || 0),
    
    // Dimensions
    chartHeight,
    chartWidth,
    margins,
    
    // Typography
    fontSize,
    
    // Chart configuration
    chartConfig,
    shouldSimplify,
    
    // Raw window size (for custom logic)
    windowWidth: windowSize.width,
    windowHeight: windowSize.height
  };
};

/**
 * Hook for detecting orientation changes (mobile)
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * Hook for touch-friendly interactions
 */
export const useTouchFriendly = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return {
    isTouchDevice,
    interactionMode: isTouchDevice ? 'touch' : 'mouse',
    minTouchTarget: 44, // iOS recommended minimum touch target size (44x44pt)
    tapDelay: isTouchDevice ? 300 : 0 // iOS tap delay
  };
};

export default useResponsiveChart;
