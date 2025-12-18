/**
 * Performance Monitoring Utility
 * 
 * Tracks and logs performance metrics for analytics features.
 * Enable with VITE_SHOW_PERFORMANCE_METRICS=true in .env
 */

import { getFeature } from '../config/features';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = getFeature('SHOW_PERFORMANCE_METRICS');
  }

  /**
   * Start timing a metric
   */
  start(name) {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      startMemory: performance.memory?.usedJSHeapSize || null
    });
  }

  /**
   * End timing and log metric
   */
  end(name, metadata = {}) {
    if (!this.enabled) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No start time found for metric: ${name}`);
      return;
    }

    const duration = performance.now() - metric.startTime;
    const memoryDelta = performance.memory 
      ? (performance.memory.usedJSHeapSize - metric.startMemory) / 1024 / 1024 
      : null;

    const logData = {
      metric: name,
      duration: `${duration.toFixed(2)}ms`,
      ...(memoryDelta && { memoryDelta: `${memoryDelta.toFixed(2)}MB` }),
      ...metadata
    };

    // Color code based on performance
    const color = duration < 100 ? 'green' : duration < 500 ? 'orange' : 'red';
    console.log(
      `%c[Performance] ${name}`,
      `color: ${color}; font-weight: bold`,
      logData
    );

    this.metrics.delete(name);
    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure(name, fn, metadata = {}) {
    if (!this.enabled) return await fn();

    this.start(name);
    try {
      const result = await fn();
      this.end(name, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      this.end(name, { ...metadata, status: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Track component render time
   */
  trackRender(componentName, phase, actualDuration) {
    if (!this.enabled) return;

    console.log(
      `%c[Render] ${componentName}`,
      'color: purple; font-weight: bold',
      {
        phase,
        duration: `${actualDuration.toFixed(2)}ms`
      }
    );
  }

  /**
   * Track network request
   */
  async trackRequest(url, options = {}) {
    const name = `API: ${url}`;
    
    this.start(name);
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      this.end(name, {
        status: response.status,
        size: JSON.stringify(data).length + ' bytes'
      });
      
      return { response, data };
    } catch (error) {
      this.end(name, { status: 'failed', error: error.message });
      throw error;
    }
  }

  /**
   * Get all performance entries (Navigation Timing API)
   */
  getNavigationMetrics() {
    if (!this.enabled) return null;

    const perfData = performance.getEntriesByType('navigation')[0];
    if (!perfData) return null;

    return {
      // DNS lookup time
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,
      
      // TCP connection time
      tcp: perfData.connectEnd - perfData.connectStart,
      
      // Request time
      request: perfData.responseStart - perfData.requestStart,
      
      // Response time
      response: perfData.responseEnd - perfData.responseStart,
      
      // DOM processing time
      domProcessing: perfData.domComplete - perfData.domLoading,
      
      // Page load time
      load: perfData.loadEventEnd - perfData.loadEventStart,
      
      // Total time from navigation start
      total: perfData.loadEventEnd - perfData.fetchStart
    };
  }

  /**
   * Track cache hit/miss
   */
  trackCache(cacheKey, hit, metadata = {}) {
    if (!this.enabled) return;

    console.log(
      `%c[Cache] ${hit ? 'HIT' : 'MISS'}`,
      `color: ${hit ? 'green' : 'orange'}; font-weight: bold`,
      {
        key: cacheKey,
        ...metadata
      }
    );
  }

  /**
   * Log memory usage
   */
  logMemory() {
    if (!this.enabled || !performance.memory) return;

    const memory = performance.memory;
    console.log('%c[Memory]', 'color: blue; font-weight: bold', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
    });
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const nav = this.getNavigationMetrics();
    const memory = performance.memory ? {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB'
    } : null;

    return {
      navigation: nav,
      memory,
      resources: performance.getEntriesByType('resource').length,
      marks: performance.getEntriesByType('mark').length,
      measures: performance.getEntriesByType('measure').length
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Singleton instance
const monitor = new PerformanceMonitor();

export default monitor;

/**
 * React hook for component performance tracking
 */
export const usePerformanceTracking = (componentName) => {
  return (id, phase, actualDuration) => {
    monitor.trackRender(componentName || id, phase, actualDuration);
  };
};

/**
 * HOC for automatic performance tracking
 */
export const withPerformanceTracking = (Component, componentName) => {
  return (props) => {
    const onRender = usePerformanceTracking(componentName || Component.name);
    
    return (
      <React.Profiler id={componentName || Component.name} onRender={onRender}>
        <Component {...props} />
      </React.Profiler>
    );
  };
};
