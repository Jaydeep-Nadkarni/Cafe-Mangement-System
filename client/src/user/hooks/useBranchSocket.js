/**
 * Placeholder hook for branch socket events
 * Socket functionality has been replaced with polling-based updates
 * This hook is kept for backwards compatibility but does nothing
 */
import React from 'react';

/**
 * Placeholder hook for branch socket events
 * Socket functionality has been replaced with polling-based updates
 * This hook is kept for backwards compatibility but does nothing
 */
export const useBranchSocket = (branchId, callbacks = {}) => {
  // No-op: All real-time updates are now handled via polling in parent components
  React.useEffect(() => {
    // This is a placeholder to satisfy hook rules if needed
    console.log('useBranchSocket placeholder effect for branch:', branchId);
  }, [branchId]);
  
  return null;
};
