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
      onTableMerge
    } = callbacks;

    // Set up event listeners
    if (onNewOrder) socket.on('new_order', onNewOrder);
    if (onOrderStatusChange) socket.on('order_status_change', onOrderStatusChange);
    if (onPaymentConfirmation) socket.on('payment_confirmation', onPaymentConfirmation);
    if (onTableMerge) socket.on('table_merge', onTableMerge);

    // Cleanup
    return () => {
      if (onNewOrder) socket.off('new_order', onNewOrder);
      if (onOrderStatusChange) socket.off('order_status_change', onOrderStatusChange);
      if (onPaymentConfirmation) socket.off('payment_confirmation', onPaymentConfirmation);
      if (onTableMerge) socket.off('table_merge', onTableMerge);
      
      leaveBranchRoom(branchId);
    };
  }, [socket, branchId]); // Re-run if socket or branchId changes
};
