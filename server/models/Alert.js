const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'system', 'kitchen'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Order', 'Table', 'Payment']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
