import { useState } from 'react';
import { useCart } from '../context/CartContext';
import FilterChips from '../components/FilterChips';
import MenuCard from '../components/MenuCard';

// Mock menu data
const MENU_ITEMS = [
  {
    id: 1,
    name: 'Espresso',
    description: 'Strong and bold',
    price: 3.99,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=500&h=500&fit=crop'
  },
  {
    id: 2,
    name: 'Cappuccino',
    description: 'Creamy and smooth',
    price: 4.49,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&h=500&fit=crop'
  },
  {
    id: 3,
    name: 'Croissant',
    description: 'Buttery and flaky',
    price: 3.50,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1444950541872-8c2960214057?w=500&h=500&fit=crop'
  },
  {
    id: 4,
    name: 'Chocolate Muffin',
    description: 'Rich chocolate flavor',
    price: 3.99,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1616365696742-92418fb74db6?w=500&h=500&fit=crop'
  },
  {
    id: 5,
    name: 'Latte',
    description: 'Smooth and velvety',
    price: 4.99,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1541182286-21eaf810afe4?w=500&h=500&fit=crop'
  },
  {
    id: 6,
    name: 'Avocado Toast',
    description: 'Healthy and fresh',
    price: 6.99,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1570521044498-a3fca1ae97f7?w=500&h=500&fit=crop'
  },
  {
    id: 7,
    name: 'Cheesecake',
    description: 'Creamy and delicious',
    price: 5.99,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1553882900-f2b06423371f?w=500&h=500&fit=crop'
  },
  {
    id: 8,
    name: 'Club Sandwich',
    description: 'Triple layered goodness',
    price: 7.99,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&fit=crop'
  },
  {
    id: 9,
    name: 'Macchiato',
    description: 'Espresso with a touch',
    price: 4.49,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop'
  },
  {
    id: 10,
    name: 'Blueberry Muffin',
    description: 'Fresh and sweet',
    price: 3.99,
    category: 'pastry',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=500&fit=crop'
  },
  {
    id: 11,
    name: 'Tiramisu',
    description: 'Italian classic',
    price: 5.99,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1571115764595-644a12c606a0?w=500&h=500&fit=crop'
  },
  {
    id: 12,
    name: 'Panini',
    description: 'Grilled to perfection',
    price: 6.99,
    category: 'sandwich',
    image: 'https://images.unsplash.com/photo-1484070992726-60efac7ee4e0?w=500&h=500&fit=crop'
  },
];

export default function MenuPage() {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <div className="px-4 md:px-6 py-6">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Menu</h1>
        <p className="text-gray-600">Explore our delicious selection</p>
      </div>

      {/* Cart Count Badge (for mobile) */}
      {totalItems > 0 && (
        <div className="mb-4 text-sm font-semibold text-primary animate-fade-in-up">
          {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
        </div>
      )}

      {/* Filter Chips */}
      <div className="mb-8 animate-fade-in-up">
        <FilterChips />
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {MENU_ITEMS.map(item => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
