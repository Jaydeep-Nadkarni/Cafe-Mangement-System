import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuCard from '../components/MenuCard';

const Menu = ({ searchQuery = '', cartItems = {}, onAddToCart, onUpdateQuantity }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, menuItems, searchQuery]);

  const fetchMenuData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu');
      const data = await response.json();
      
      if (data.success) {
        setMenuItems(data.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.data.map(item => item.category))];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load menu items');
      setLoading(false);
      console.error('Error fetching menu:', err);
    }
  };

  const filterItems = () => {
    let items = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }

    setFilteredItems(items);
  };

  const getTotalStats = () => {
    let totalItems = 0;
    let totalPrice = 0;

    Object.entries(cartItems).forEach(([itemId, quantity]) => {
      const item = menuItems.find(i => (i._id || i.id) === itemId);
      if (item) {
        totalItems += quantity;
        totalPrice += item.price * quantity;
      }
    });

    return { totalItems, totalPrice };
  };

  const { totalItems, totalPrice } = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-130px)] px-4 py-6 pb-[100px] md:py-8">
        <div className="text-center p-12 text-gray-500 text-lg">Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-130px)] px-4 py-6 pb-[100px] md:py-8">
        <div className="text-center p-12 text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-130px)] px-4 py-6 pb-[100px] md:py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Our Menu</h1>
        <p className="text-lg text-gray-500 m-0">Discover our delicious selection of café items</p>
      </div>

      <div className="flex gap-2 overflow-x-auto py-4 mb-8 scrollbar-hide md:justify-center">
        <button
          className={`flex-shrink-0 px-6 py-2 border-2 rounded-2xl text-sm font-semibold capitalize cursor-pointer transition-all duration-150 whitespace-nowrap ${
            selectedCategory === 'all' 
              ? 'bg-gradient-to-br from-primary to-primary-light border-primary text-gray-900 shadow-yellow' 
              : 'bg-white text-gray-900 border-gray-200 hover:border-primary hover:bg-primary/10'
          }`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`flex-shrink-0 px-6 py-2 border-2 rounded-2xl text-sm font-semibold capitalize cursor-pointer transition-all duration-150 whitespace-nowrap ${
              selectedCategory === category 
                ? 'bg-gradient-to-br from-primary to-primary-light border-primary text-gray-900 shadow-yellow' 
                : 'bg-white text-gray-900 border-gray-200 hover:border-primary hover:bg-primary/10'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {filteredItems.map(item => (
          <MenuCard
            key={item._id || item.id}
            item={item}
            quantity={cartItems[item._id || item.id] || 0}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center p-12 text-gray-500 text-lg">No items found in this category.</div>
      )}

      {/* Sticky Bottom Order Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-50 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{totalItems} items</span>
              <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>
            <button 
              className="bg-primary text-gray-900 px-8 py-3 rounded-2xl font-bold text-lg shadow-yellow hover:bg-primary-dark transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/order-summary')}
            >
              Place Your Order
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
