import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import FilterChips from '../components/FilterChips';
import MenuCard from '../components/MenuCard';
import { MENU_ITEMS } from '../data/menuItems';

export default function MenuPage() {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const filteredItems = useMemo(() => {
    if (!searchQuery) return MENU_ITEMS;
    const lowerQuery = searchQuery.toLowerCase();
    return MENU_ITEMS.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="px-4 md:px-6 py-6 pb-24">
      {/* Filter Chips */}
      <div className="mb-6 animate-fade-in-up">
        <FilterChips />
      </div>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
