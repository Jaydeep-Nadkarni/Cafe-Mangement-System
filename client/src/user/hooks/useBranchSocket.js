import { useEffect } from 'react';

/**
 * Placeholder hook for branch socket events
 * Socket functionality has been replaced with polling-based updates
 * This hook is kept for backwards compatibility but does nothing
 */
export const useBranchSocket = (branchId, callbacks = {}) => {
  // No-op: All real-time updates are now handled via polling in parent components
  useEffect(() => {
    // This is a placeholder to satisfy hook rules if needed, 
    // though the error suggests it was missing or miscalled.
  }, [branchId]);
  
  return null;
};
