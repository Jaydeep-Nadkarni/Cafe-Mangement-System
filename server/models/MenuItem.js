const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters']
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    image: {
      type: String,
      default: null
    },
    isVegetarian: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isSpicy: {
      type: Boolean,
      default: false
    },
    allergies: {
      type: [String],
      default: []
    },
    ingredients: {
      type: [String],
      default: []
    },
    availabilitySchedule: {
      type: [{
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        available: Boolean
      }],
      default: []
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    disabledUntil: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null
    },
    popularity: {
      type: Number,
      default: 0
    },
    tag: {
      type: String,
      default: null
    },
    sizes: {
      type: [{
        name: String,
        label: String,
        price: Number
      }],
      default: null
    }
  },
  { timestamps: true }
);

// Index for frequently queried fields
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ branch: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
