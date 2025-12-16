import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { saveTableSession, getTableSession, getSessionDisplayString } from '../utils/sessionStorage';
import FilterChips from '../components/FilterChips';
import MenuCard from '../components/MenuCard';
import SkeletonCard from '../../components/skeletons/SkeletonCard';
import axios from 'axios';
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
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch menu from database
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const session = getTableSession();
        const branch = branchCode || session?.branchCode || '';
        
        const response = await axios.get(`${API_URL}/api/public/menu`, {
          params: branch ? { branchCode: branch } : {}
        });
        
        setMenuItems(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [branchCode, API_URL]);

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

  // Filter out any undefined items
  const validMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item || !item.name || !item.category) {
        return false;
      }
      // If sizes exist, ensure they're a non-empty array
      if (item.sizes && !Array.isArray(item.sizes)) {
        return false;
      }
      return true;
    });
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = validMenuItems;

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
  }, [searchQuery, activeFilter, validMenuItems]);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    const validItems = menuItems.filter(item => item && item.category);
    const uniqueCategories = [...new Set(validItems.map(item => item.category))];
    return uniqueCategories.sort();
  }, [menuItems]);

  return (
    <div className="px-4 md:px-6 py-6 pb-32">
      {/* Session Banner */}
      {currentSession && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
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
          categories={categories}
        />
      </div>

      {/* Menu Grid - Show skeletons while loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MenuCard key={item.id || item._id} item={item} />
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
