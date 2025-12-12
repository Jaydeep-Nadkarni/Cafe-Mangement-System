const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to menu data file
const MENU_FILE = path.join(__dirname, '../data/menu.json');

// Helper function to read menu data
const readMenuData = async () => {
  try {
    const data = await fs.readFile(MENU_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading menu data:', error);
    throw new Error('Unable to load menu data');
  }
};

// GET /api/menu - Get all menu items
router.get('/', async (req, res, next) => {
  try {
    const menuItems = await readMenuData();
    
    // Optional query parameters for filtering
    const { available, search } = req.query;
    
    let filteredItems = menuItems;
    
    // Filter by availability
    if (available !== undefined) {
      const isAvailable = available === 'true';
      filteredItems = filteredItems.filter(item => item.available === isAvailable);
    }
    
    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      count: filteredItems.length,
      data: filteredItems
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/categories - Get all unique categories
router.get('/categories', async (req, res, next) => {
  try {
    const menuItems = await readMenuData();
    const categories = [...new Set(menuItems.map(item => item.category))];
    
    // Get count of items per category
    const categoriesWithCount = categories.map(category => ({
      name: category,
      count: menuItems.filter(item => item.category === category).length
    }));
    
    res.json({
      success: true,
      count: categories.length,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/category/:category - Get menu items by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const menuItems = await readMenuData();
    
    const filteredItems = menuItems.filter(
      item => item.category.toLowerCase() === category.toLowerCase()
    );
    
    if (filteredItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No items found in category: ${category}`
      });
    }
    
    res.json({
      success: true,
      category: category,
      count: filteredItems.length,
      data: filteredItems
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/:id - Get single menu item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItems = await readMenuData();
    
    const item = menuItems.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
