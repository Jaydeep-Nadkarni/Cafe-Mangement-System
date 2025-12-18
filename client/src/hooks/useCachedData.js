import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for client-side data caching with localStorage/sessionStorage
 * 
 * @param {string} cacheKey - Unique key for this cached data
 * @param {Function} fetchFn - Async function to fetch fresh data
 * @param {Object} options - Configuration options
 * @param {string} options.storage - 'local' or 'session' (default: 'session')
 * @param {number} options.ttl - Time to live in milliseconds (default: 5 minutes)
 * @param {boolean} options.enabled - Enable/disable caching (default: true)
 * @param {Array} options.dependencies - Dependencies that trigger cache invalidation
 * 
 * @returns {Object} { data, loading, error, refresh, clearCache }
 */
const useCachedData = (cacheKey, fetchFn, options = {}) => {
  const {
    storage = 'session',
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Get storage object
  const storageObj = storage === 'local' ? localStorage : sessionStorage;

  /**
   * Get cached data from storage
   */
  const getCachedData = useCallback(() => {
    if (!enabled) return null;

    try {
      const cached = storageObj.getItem(cacheKey);
      if (!cached) return null;

      const { data: cachedData, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < ttl) {
        return cachedData;
      }

      // Cache expired, remove it
      storageObj.removeItem(cacheKey);
      return null;
    } catch (err) {
      console.error('Error reading cache:', err);
      return null;
    }
  }, [cacheKey, enabled, storageObj, ttl]);

  /**
   * Set cached data in storage
   */
  const setCachedData = useCallback((newData) => {
    if (!enabled) return;

    try {
      const cacheEntry = {
        data: newData,
        timestamp: Date.now()
      };
      storageObj.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (err) {
      console.error('Error writing cache:', err);
      // Storage might be full or disabled, continue without caching
    }
  }, [cacheKey, enabled, storageObj]);

  /**
   * Clear cached data
   */
  const clearCache = useCallback(() => {
    try {
      storageObj.removeItem(cacheKey);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, [cacheKey, storageObj]);

  /**
   * Fetch data with caching logic
   */
  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached data first (unless force refresh)
      if (!force && enabled) {
        const cached = getCachedData();
        if (cached) {
          setData(cached);
          setCacheHit(true);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      setCacheHit(false);
      const freshData = await fetchFn();
      
      // Cache the fresh data
      setCachedData(freshData);
      setData(freshData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
      
      // On error, try to use stale cache as fallback
      if (enabled) {
        const staleCache = storageObj.getItem(cacheKey);
        if (staleCache) {
          try {
            const { data: cachedData } = JSON.parse(staleCache);
            setData(cachedData);
            setCacheHit(true);
            console.warn('Using stale cache as fallback');
          } catch (parseErr) {
            // If parsing fails, data stays null
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFn, getCachedData, setCachedData, cacheKey, storageObj]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  /**
   * Fetch data on mount and when dependencies change
   */
  useEffect(() => {
    // Clear cache when dependencies change
    if (dependencies.length > 0) {
      clearCache();
    }
    
    fetchData();
  }, [fetchData, clearCache, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    cacheHit // For debugging/monitoring
  };
};

/**
 * Utility function to generate cache keys from parameters
 */
export const generateCacheKey = (prefix, params) => {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistency
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('&');
  
  return `${prefix}:${paramString}`;
};

/**
 * Clear all caches with a specific prefix
 */
export const clearCachesByPrefix = (prefix, storage = 'session') => {
  const storageObj = storage === 'local' ? localStorage : sessionStorage;
  const keys = [];
  
  // Collect all keys with the prefix
  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  
  // Remove them
  keys.forEach(key => storageObj.removeItem(key));
  
  console.log(`Cleared ${keys.length} cached items with prefix: ${prefix}`);
};

export default useCachedData;
