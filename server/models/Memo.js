const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  // Track read status by managers
  readByManagers: {
    type: [
      {
        manager: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin'
        },
        readAt: {
          type: Date,
          default: Date.now
        },
        acknowledged: {
          type: Boolean,
          default: false
        },
        acknowledgedAt: Date
      }
    ],
    default: []
  },
  // Overall status
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Index for queries
memoSchema.index({ branch: 1, status: 1 });
memoSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Memo', memoSchema);
