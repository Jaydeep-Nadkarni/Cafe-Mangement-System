/**
 * Feature Flags Configuration
 * 
 * Controls feature availability across the application.
 * Flags can be overridden by environment variables or runtime config.
 */

// Environment-based feature flags
const ENV = import.meta.env.MODE || 'development';

/**
 * Feature flag definitions
 */
export const FEATURES = {
  // Branch Management
  SINGLE_BRANCH_MODE: import.meta.env.VITE_SINGLE_BRANCH_MODE === 'true' || false,
  
  // Real-time Features
  ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false', // On by default
  REAL_TIME_THROTTLE_MS: parseInt(import.meta.env.VITE_REAL_TIME_THROTTLE_MS) || 7000,
  
  // Analytics Features
  ENABLE_STATS_PAGE: import.meta.env.VITE_ENABLE_STATS_PAGE !== 'false', // On by default
  ENABLE_REPORTS_PAGE: import.meta.env.VITE_ENABLE_REPORTS_PAGE !== 'false', // On by default
  
  // Export Features
  ENABLE_CSV_EXPORT: import.meta.env.VITE_ENABLE_CSV_EXPORT !== 'false', // On by default
  ENABLE_PNG_EXPORT: import.meta.env.VITE_ENABLE_PNG_EXPORT !== 'false', // On by default
  
  // Caching
  ENABLE_CLIENT_CACHING: import.meta.env.VITE_ENABLE_CLIENT_CACHING !== 'false', // On by default
  CACHE_TTL_STATS: parseInt(import.meta.env.VITE_CACHE_TTL_STATS) || 5 * 60 * 1000, // 5 minutes
  CACHE_TTL_REPORTS: parseInt(import.meta.env.VITE_CACHE_TTL_REPORTS) || 24 * 60 * 60 * 1000, // 24 hours
  
  // Mobile Optimization
  ENABLE_MOBILE_CHARTS: import.meta.env.VITE_ENABLE_MOBILE_CHARTS !== 'false', // On by default
  MOBILE_BREAKPOINT: parseInt(import.meta.env.VITE_MOBILE_BREAKPOINT) || 768, // px
  MOBILE_MAX_DATA_POINTS: parseInt(import.meta.env.VITE_MOBILE_MAX_DATA_POINTS) || 10,
  
  // Performance
  ENABLE_CHART_SKELETONS: import.meta.env.VITE_ENABLE_CHART_SKELETONS !== 'false', // On by default
  ENABLE_ERROR_BOUNDARIES: import.meta.env.VITE_ENABLE_ERROR_BOUNDARIES !== 'false', // On by default
  
  // Debug Features (development only)
  SHOW_CACHE_INDICATORS: ENV === 'development',
  SHOW_PERFORMANCE_METRICS: ENV === 'development',
  VERBOSE_LOGGING: ENV === 'development',
  
  // Advanced Analytics
  ENABLE_DERIVED_METRICS: import.meta.env.VITE_ENABLE_DERIVED_METRICS !== 'false', // On by default
  ENABLE_RISK_ANALYSIS: import.meta.env.VITE_ENABLE_RISK_ANALYSIS !== 'false', // On by default
  
  // Chart Types
  ENABLE_HEATMAPS: import.meta.env.VITE_ENABLE_HEATMAPS !== 'false', // On by default
  ENABLE_TREEMAPS: import.meta.env.VITE_ENABLE_TREEMAPS !== 'false', // On by default
  ENABLE_BOXPLOTS: import.meta.env.VITE_ENABLE_BOXPLOTS !== 'false', // On by default
  ENABLE_SCATTER: import.meta.env.VITE_ENABLE_SCATTER !== 'false', // On by default
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature flag
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURES[featureName] ?? false;
};

/**
 * Get feature value (for non-boolean flags)
 * @param {string} featureName - Name of the feature flag
 * @param {*} defaultValue - Default value if flag not found
 * @returns {*} Feature value or default
 */
export const getFeatureValue = (featureName, defaultValue = null) => {
  return FEATURES[featureName] ?? defaultValue;
};

/**
 * Runtime feature flag overrides (for testing/admin panel)
 */
const runtimeOverrides = {};

/**
 * Override a feature flag at runtime
 * @param {string} featureName - Name of the feature flag
 * @param {*} value - New value for the flag
 */
export const overrideFeature = (featureName, value) => {
  runtimeOverrides[featureName] = value;
  console.log(`Feature flag override: ${featureName} = ${value}`);
};

/**
 * Get feature with runtime overrides applied
 * @param {string} featureName - Name of the feature flag
 * @returns {*} Feature value with overrides
 */
export const getFeature = (featureName) => {
  return runtimeOverrides[featureName] ?? FEATURES[featureName];
};

/**
 * Clear all runtime overrides
 */
export const clearOverrides = () => {
  Object.keys(runtimeOverrides).forEach(key => delete runtimeOverrides[key]);
  console.log('All feature flag overrides cleared');
};

/**
 * Get all feature flags (for debugging/admin panel)
 * @returns {Object} All feature flags with current values
 */
export const getAllFeatures = () => {
  return {
    ...FEATURES,
    ...runtimeOverrides
  };
};

/**
 * Preset configurations for different deployment scenarios
 */
export const PRESETS = {
  // Single branch cafe
  SINGLE_CAFE: {
    SINGLE_BRANCH_MODE: true,
    ENABLE_REAL_TIME: true,
    ENABLE_MOBILE_CHARTS: true,
    CACHE_TTL_STATS: 2 * 60 * 1000, // 2 minutes (more frequent updates)
  },
  
  // Multi-branch enterprise
  ENTERPRISE: {
    SINGLE_BRANCH_MODE: false,
    ENABLE_REAL_TIME: true,
    ENABLE_CLIENT_CACHING: true,
    CACHE_TTL_STATS: 10 * 60 * 1000, // 10 minutes (less frequent updates)
    CACHE_TTL_REPORTS: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Performance optimized (for large datasets)
  PERFORMANCE: {
    ENABLE_CLIENT_CACHING: true,
    ENABLE_MOBILE_CHARTS: true,
    MOBILE_MAX_DATA_POINTS: 8,
    REAL_TIME_THROTTLE_MS: 10000, // 10 seconds
  },
  
  // Minimal features (for demos/testing)
  MINIMAL: {
    ENABLE_CSV_EXPORT: false,
    ENABLE_PNG_EXPORT: false,
    ENABLE_HEATMAPS: false,
    ENABLE_TREEMAPS: false,
    ENABLE_BOXPLOTS: false,
  }
};

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of the preset
 */
export const applyPreset = (presetName) => {
  const preset = PRESETS[presetName];
  if (!preset) {
    console.error(`Unknown preset: ${presetName}`);
    return;
  }
  
  Object.entries(preset).forEach(([key, value]) => {
    overrideFeature(key, value);
  });
  
  console.log(`Applied preset: ${presetName}`);
};

export default FEATURES;
