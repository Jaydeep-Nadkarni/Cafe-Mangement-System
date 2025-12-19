const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  color: {
    type: String,
    default: '#6B7280' // gray-500
  },
  icon: {
    type: String,
    default: 'tag'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique category per branch
categorySchema.index({ slug: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
