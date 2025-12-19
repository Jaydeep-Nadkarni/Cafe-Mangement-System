const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const defaultCategories = [
  { name: 'Coffee', slug: 'coffee', color: '#8B4513', icon: 'coffee', sortOrder: 1 },
  { name: 'Tea', slug: 'tea', color: '#10B981', icon: 'coffee', sortOrder: 2 },
  { name: 'Cold Beverages', slug: 'cold-beverages', color: '#06B6D4', icon: 'glass-water', sortOrder: 3 },
  { name: 'Hot Beverages', slug: 'hot-beverages', color: '#EF4444', icon: 'mug-hot', sortOrder: 4 },
  { name: 'Breakfast', slug: 'breakfast', color: '#F59E0B', icon: 'egg-fried', sortOrder: 5 },
  { name: 'Sandwiches', slug: 'sandwiches', color: '#84CC16', icon: 'sandwich', sortOrder: 6 },
  { name: 'Burgers', slug: 'burgers', color: '#F97316', icon: 'burger', sortOrder: 7 },
  { name: 'Snacks', slug: 'snacks', color: '#FBBF24', icon: 'cookie', sortOrder: 8 },
  { name: 'Pastries', slug: 'pastries', color: '#EC4899', icon: 'croissant', sortOrder: 9 },
  { name: 'Desserts', slug: 'desserts', color: '#A855F7', icon: 'ice-cream', sortOrder: 10 },
  { name: 'Cakes', slug: 'cakes', color: '#F43F5E', icon: 'cake-slice', sortOrder: 11 },
  { name: 'Salads', slug: 'salads', color: '#22C55E', icon: 'salad', sortOrder: 12 },
  { name: 'Smoothies', slug: 'smoothies', color: '#D946EF', icon: 'glass', sortOrder: 13 },
  { name: 'Milkshakes', slug: 'milkshakes', color: '#3B82F6', icon: 'milkshake', sortOrder: 14 },
  { name: 'Specials', slug: 'specials', color: '#EAB308', icon: 'star', sortOrder: 15 }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if categories already exist
    const existingCount = await Category.countDocuments({ branch: null });
    
    if (existingCount > 0) {
      console.log(`${existingCount} global categories already exist. Skipping seed.`);
      process.exit(0);
    }

    // Insert default categories as global (branch: null)
    await Category.insertMany(
      defaultCategories.map(cat => ({ ...cat, branch: null, isActive: true }))
    );

    console.log(`✅ Successfully seeded ${defaultCategories.length} categories`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
