import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Hook to listen for branch-specific real-time events
 * @param {string} branchId - The ID of the branch to listen to
 * @param {Object} callbacks - Callback functions for events
 * @param {Function} callbacks.onNewOrder - Called when a new order is created
 * @param {Function} callbacks.onOrderStatusChange - Called when order status changes
 * @param {Function} callbacks.onPaymentConfirmation - Called when payment is confirmed
 * @param {Function} callbacks.onTableMerge - Called when tables are merged
 * @param {Function} callbacks.onStatsUpdate - Called when stats are updated (every 7s)
 * @param {Function} callbacks.onCriticalMetric - Called when critical metrics change (instant)
 * @param {Function} callbacks.onTableOccupancyChange - Called when table occupancy changes
 */
export const useBranchSocket = (branchId, callbacks = {}) => {
  const { socket, joinBranchRoom, leaveBranchRoom } = useSocket();

  useEffect(() => {
    if (!socket || !branchId) return;

    // Join the branch room
    joinBranchRoom(branchId);

    const {
      onNewOrder,
      onOrderStatusChange,
      onPaymentConfirmation,
      onTableMerge,
      onNewAlert,
      onStatsUpdate,
      onCriticalMetric,
      onTableOccupancyChange
    } = callbacks;

    // Set up event listeners
    if (onNewOrder) socket.on('new_order', onNewOrder);
    if (onOrderStatusChange) socket.on('order_status_change', onOrderStatusChange);
    if (onPaymentConfirmation) socket.on('payment_confirmation', onPaymentConfirmation);
    if (onTableMerge) socket.on('table_merge', onTableMerge);
    if (onNewAlert) socket.on('new_alert', onNewAlert);

    // Stats-specific events
    if (onStatsUpdate) socket.on('stats_update', onStatsUpdate);
    if (onCriticalMetric) socket.on('critical_metric_update', onCriticalMetric);
    if (onTableOccupancyChange) socket.on('table_occupancy_change', onTableOccupancyChange);
    if (callbacks.onOrderUpdate) socket.on('order_updated', callbacks.onOrderUpdate);

    // Cleanup
    return () => {
      if (onNewOrder) socket.off('new_order', onNewOrder);
      if (onOrderStatusChange) socket.off('order_status_change', onOrderStatusChange);
      if (onPaymentConfirmation) socket.off('payment_confirmation', onPaymentConfirmation);
      if (onTableMerge) socket.off('table_merge', onTableMerge);
      if (onNewAlert) socket.off('new_alert', onNewAlert);

      // Remove stats listeners
      if (onStatsUpdate) socket.off('stats_update', onStatsUpdate);
      if (onCriticalMetric) socket.off('critical_metric_update', onCriticalMetric);
      if (onTableOccupancyChange) socket.off('table_occupancy_change', onTableOccupancyChange);
      if (callbacks.onOrderUpdate) socket.off('order_updated', callbacks.onOrderUpdate);

      leaveBranchRoom(branchId);
    };
  }, [socket, branchId]); // Re-run if socket or branchId changes
};
