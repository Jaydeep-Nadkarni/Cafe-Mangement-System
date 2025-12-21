const mongoose = require('mongoose');

/**
 * AUDIT LOG MODEL
 * 
 * Tracks all critical operations on orders:
 * - Order edits (item changes, price adjustments, discounts)
 * - Order merges (combining multiple orders)
 * - Order deletions/cancellations
 * - Manual completions (forcing order to closed status)
 * - Manual table releases
 * 
 * Used for compliance, dispute resolution, and operation analytics
 */

const auditLogSchema = new mongoose.Schema(
  {
    // Reference information
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true
    },
    
    // Operation type and target
    operationType: {
      type: String,
      enum: [
        'order_created',        // New order created
        'order_edited',         // Items, prices, discounts changed
        'order_merged',         // Multiple orders combined
        'order_deleted',        // Order cancelled/deleted
        'order_completed',      // Manual completion (forced to closed)
        'order_paid',           // Payment processed
        'order_refunded',       // Refund issued
        'table_released',       // Table released manually
        'status_changed',       // Order status transition
        'item_added',           // Item added to order
        'item_removed',         // Item removed from order
        'item_modified',        // Item quantity/price changed
        'coupon_applied',       // Coupon applied to order
        'discount_adjusted'     // Discount amount changed
      ],
      required: true,
      index: true
    },
    
    // Severity level for impact assessment
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },
    
    // Resource being operated on
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table'
    },
    
    // User who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    performedByName: String,
    performedByRole: String,
    performedByEmail: String,
    
    // Change details
    changes: {
      before: mongoose.Schema.Types.Mixed,  // State before change
      after: mongoose.Schema.Types.Mixed,   // State after change
      fieldChanged: [String],               // Which fields were modified
      reason: String                        // Why the change was made
    },
    
    // Merge-specific metadata
    mergeMetadata: {
      mergedOrderIds: [mongoose.Schema.Types.ObjectId],
      mergeCount: Number,
      totalAmountMerged: Number,
      mergeReason: String
    },
    
    // Deletion-specific metadata
    deletionMetadata: {
      deletionReason: String,
      itemsAffected: Number,
      amountLost: Number,
      refundIssued: Boolean,
      refundAmount: Number,
      refundMethod: String
    },
    
    // Financial impact
    financialImpact: {
      amountChanged: Number,
      discountApplied: Number,
      refundAmount: Number,
      taxAdjustment: Number
    },
    
    // Validation and approval
    requiresApproval: Boolean,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedByName: String,
    approvalReason: String,
    approvedAt: Date,
    
    // System context
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    
    // Status and notes
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'completed'
    },
    
    notes: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true,
    collection: 'audit_logs'
  }
);

// Indexes for efficient querying
auditLogSchema.index({ branch: 1, createdAt: -1 });
auditLogSchema.index({ branch: 1, operationType: 1 });
auditLogSchema.index({ orderId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ branch: 1, operationType: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, branch: 1 });
auditLogSchema.index({ createdAt: -1 }); // For time-range queries
auditLogSchema.index({ tableId: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, requiresApproval: 1 });

// TTL index: Keep audit logs for 2 years (730 days)
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 63072000 }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
