import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { saveTableSession, getTableSession, getSessionDisplayString } from '../utils/sessionStorage';
import FilterChips from '../components/FilterChips';
import MenuCard from '../components/MenuCard';
import { MENU_ITEMS } from '../data/menuItems';
import { AlertCircle, Clock } from 'lucide-react';

export default function MenuPage() {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const branchCode = searchParams.get('branch') || ''; // e.g., TLK001
  const tableNumber = searchParams.get('table') || ''; // e.g., 7
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentSession, setCurrentSession] = useState(null);

  // Handle URL params and session management
  useEffect(() => {
    // If QR code is scanned with URL params, save the session
    if (branchCode && tableNumber) {
      saveTableSession(branchCode, tableNumber);
      setCurrentSession(getTableSession());
    } else {
      // Otherwise, try to load existing session
      const session = getTableSession();
      setCurrentSession(session);
    }
  }, [branchCode, tableNumber]);

  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS;

    // Apply category filter
    if (activeFilter !== 'all') {
      items = items.filter(item => item.category === activeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) || 
        item.description.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
      );
    }

    return items;
  }, [searchQuery, activeFilter]);

  return (
    <div className="px-4 md:px-6 py-6 pb-32">
      {/* Session Banner */}
      {currentSession && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              🎯 {getSessionDisplayString()}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Session expires at midnight. Scan a new QR code to change tables.
            </p>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="mb-6 animate-fade-in-up">
        <FilterChips 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />
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
          <p className="text-gray-500 text-lg">
            {searchQuery 
              ? `No items found matching "${searchQuery}"` 
              : 'No items in this category'}
          </p>
        </div>
      )}
    </div>
  );
}
