const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');

/**
 * AUDIT SERVICE
 * 
 * Centralized audit logging for order operations.
 * Tracks all critical changes with context and financial impact.
 */

/**
 * Log order edit/modification
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logOrderEdit = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  beforeState,
  afterState,
  fieldsChanged = [],
  reason = null,
  financialImpact = {}
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_edited',
      severity: calculateEditSeverity(beforeState, afterState),
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      changes: {
        before: beforeState,
        after: afterState,
        fieldChanged: fieldsChanged,
        reason
      },
      financialImpact,
      status: 'completed'
    });

    await auditLog.save();
    console.log(`[AUDIT] Order ${orderId} edited by ${performedByName} - Fields: ${fieldsChanged.join(', ')}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log order edit:', error.message);
    throw error;
  }
};

/**
 * Log order merge operation
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logOrderMerge = async ({
  resultingOrderId,
  mergedOrderIds,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  totalAmountMerged,
  reason = null
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_merged',
      severity: 'info',
      orderId: resultingOrderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      mergeMetadata: {
        mergedOrderIds,
        mergeCount: mergedOrderIds.length,
        totalAmountMerged,
        mergeReason: reason
      },
      status: 'completed',
      notes: `Merged ${mergedOrderIds.length} orders into ${resultingOrderId}`
    });

    await auditLog.save();
    console.log(`[AUDIT] Order merge: ${mergedOrderIds.length} orders merged by ${performedByName}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log order merge:', error.message);
    throw error;
  }
};

/**
 * Log order deletion/cancellation
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logOrderDeletion = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  orderData,
  deletionReason = null,
  refundIssued = false,
  refundAmount = 0,
  refundMethod = null,
  requiresApproval = false
}) => {
  try {
    const severity = refundAmount > 10000 ? 'critical' : 'warning';
    
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_deleted',
      severity,
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      deletionMetadata: {
        deletionReason,
        itemsAffected: orderData.items?.length || 0,
        amountLost: orderData.total || 0,
        refundIssued,
        refundAmount,
        refundMethod
      },
      financialImpact: {
        amountChanged: -(orderData.total || 0),
        refundAmount
      },
      requiresApproval,
      status: requiresApproval ? 'pending' : 'completed',
      changes: {
        before: orderData,
        after: null,
        fieldChanged: ['status', 'paymentStatus'],
        reason: deletionReason
      }
    });

    await auditLog.save();
    console.log(`[AUDIT] Order ${orderId} deleted by ${performedByName} - Amount: ${orderData.total}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log order deletion:', error.message);
    throw error;
  }
};

/**
 * Log order completion (forced close)
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logOrderCompletion = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  beforeState,
  afterState,
  reason = null
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_completed',
      severity: 'warning',
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      changes: {
        before: beforeState,
        after: afterState,
        fieldChanged: ['status'],
        reason
      },
      requiresApproval: false,
      status: 'completed',
      notes: reason || 'Manual order completion'
    });

    await auditLog.save();
    console.log(`[AUDIT] Order ${orderId} manually completed by ${performedByName}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log order completion:', error.message);
    throw error;
  }
};

/**
 * Log item addition to order
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logItemAddition = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  itemData,
  quantityAdded,
  priceAdded
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'item_added',
      severity: 'info',
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      changes: {
        after: itemData,
        fieldChanged: ['items']
      },
      financialImpact: {
        amountChanged: priceAdded
      },
      status: 'completed',
      notes: `Added ${quantityAdded} units - Price impact: +${priceAdded}`
    });

    await auditLog.save();
    console.log(`[AUDIT] Item added to order ${orderId} by ${performedByName} - Impact: +${priceAdded}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log item addition:', error.message);
    throw error;
  }
};

/**
 * Log item removal from order
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logItemRemoval = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  itemData,
  quantityRemoved,
  priceRemoved
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'item_removed',
      severity: 'info',
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      changes: {
        before: itemData,
        fieldChanged: ['items']
      },
      financialImpact: {
        amountChanged: -priceRemoved
      },
      status: 'completed',
      notes: `Removed ${quantityRemoved} units - Price impact: -${priceRemoved}`
    });

    await auditLog.save();
    console.log(`[AUDIT] Item removed from order ${orderId} by ${performedByName} - Impact: -${priceRemoved}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log item removal:', error.message);
    throw error;
  }
};

/**
 * Log manual table release
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logTableRelease = async ({
  tableId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  ordersAffected,
  totalAmount,
  reason = null
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'table_released',
      severity: 'warning',
      tableId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      changes: {
        fieldChanged: ['table.status'],
        reason
      },
      metadata: {
        ordersAffected,
        totalAmountOnTable: totalAmount
      },
      requiresApproval: totalAmount > 5000,
      status: totalAmount > 5000 ? 'pending' : 'completed'
    });

    await auditLog.save();
    console.log(`[AUDIT] Table ${tableId} released by ${performedByName} - Orders affected: ${ordersAffected.length}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log table release:', error.message);
    throw error;
  }
};

/**
 * Log payment processing
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logPayment = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  paymentMethod,
  amount,
  paymentId = null,
  status = 'completed'
}) => {
  try {
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_paid',
      severity: 'info',
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      financialImpact: {
        amountChanged: amount
      },
      metadata: {
        paymentMethod,
        paymentId
      },
      status: 'completed'
    });

    await auditLog.save();
    console.log(`[AUDIT] Payment processed for order ${orderId} - Method: ${paymentMethod}, Amount: ${amount}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log payment:', error.message);
    throw error;
  }
};

/**
 * Log order refund
 * @param {Object} config
 * @returns {Promise<Object>} Audit log entry
 */
const logRefund = async ({
  orderId,
  branchId,
  performedBy,
  performedByName,
  performedByRole,
  performedByEmail,
  refundAmount,
  refundMethod,
  reason = null
}) => {
  try {
    const severity = refundAmount > 10000 ? 'critical' : 'warning';
    
    const auditLog = new AuditLog({
      branch: branchId,
      operationType: 'order_refunded',
      severity,
      orderId,
      performedBy,
      performedByName,
      performedByRole,
      performedByEmail,
      financialImpact: {
        refundAmount: -refundAmount
      },
      metadata: {
        refundMethod,
        reason
      },
      requiresApproval: refundAmount > 5000,
      status: refundAmount > 5000 ? 'pending' : 'completed',
      changes: {
        fieldChanged: ['paymentStatus'],
        reason
      }
    });

    await auditLog.save();
    console.log(`[AUDIT] Refund processed for order ${orderId} - Amount: ${refundAmount}, Method: ${refundMethod}`);
    
    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log refund:', error.message);
    throw error;
  }
};

/**
 * Query audit logs with filtering
 * @param {Object} filters
 * @returns {Promise<Array>} Audit log entries
 */
const getAuditLogs = async ({
  branchId,
  orderId = null,
  operationType = null,
  performedBy = null,
  startDate = null,
  endDate = null,
  limit = 100,
  skip = 0
}) => {
  try {
    const query = { branch: branchId };

    if (orderId) query.orderId = orderId;
    if (operationType) query.operationType = operationType;
    if (performedBy) query.performedBy = performedBy;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .populate('orderId', 'orderNumber total status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return logs;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to query audit logs:', error.message);
    throw error;
  }
};

/**
 * Get audit summary for compliance/reporting
 * @param {Object} config
 * @returns {Promise<Object>} Summary statistics
 */
const getAuditSummary = async ({
  branchId,
  startDate,
  endDate
}) => {
  try {
    const query = { branch: branchId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      totalLogs,
      byType,
      bySeverity,
      byUser,
      criticalActions,
      pendingApprovals,
      totalFinancialImpact
    ] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$operationType', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$performedByName', count: { $sum: 1 } } }
      ]),
      AuditLog.countDocuments({ ...query, severity: 'critical' }),
      AuditLog.countDocuments({ ...query, status: 'pending' }),
      AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalImpact: { $sum: '$financialImpact.amountChanged' },
            totalRefunds: { $sum: '$financialImpact.refundAmount' }
          }
        }
      ])
    ]);

    return {
      period: { startDate, endDate },
      totalOperations: totalLogs,
      byOperationType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topUsers: byUser.slice(0, 10),
      criticalActions,
      pendingApprovals,
      financialImpact: totalFinancialImpact[0] || { totalImpact: 0, totalRefunds: 0 }
    };
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to generate audit summary:', error.message);
    throw error;
  }
};

/**
 * Calculate edit severity based on financial impact
 * @param {Object} before
 * @param {Object} after
 * @returns {String} 'info', 'warning', or 'critical'
 */
const calculateEditSeverity = (before, after) => {
  const amountChanged = Math.abs((after.total || 0) - (before.total || 0));
  const itemsChanged = Math.abs((after.items?.length || 0) - (before.items?.length || 0));

  if (amountChanged > 5000 || itemsChanged > 5) {
    return 'critical';
  }
  if (amountChanged > 1000 || itemsChanged > 2) {
    return 'warning';
  }
  return 'info';
};

module.exports = {
  logOrderEdit,
  logOrderMerge,
  logOrderDeletion,
  logOrderCompletion,
  logItemAddition,
  logItemRemoval,
  logTableRelease,
  logPayment,
  logRefund,
  getAuditLogs,
  getAuditSummary
};
