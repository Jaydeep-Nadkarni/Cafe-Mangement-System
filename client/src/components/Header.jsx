import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Coffee, Search, X } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local state with URL param when on menu page
  useEffect(() => {
    if (location.pathname === '/menu') {
      const query = searchParams.get('search') || '';
      setSearchQuery(query);
    }
  }, [location.pathname, searchParams]);

  // Generate suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = MENU_ITEMS.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // If on menu page, update URL immediately for live filtering
    if (location.pathname === '/menu') {
      if (query) {
        setSearchParams({ search: query });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (itemName) => {
    setSearchQuery(itemName);
    setShowSuggestions(false);
    navigate(`/menu?search=${encodeURIComponent(itemName)}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (location.pathname === '/menu') setSearchParams({});
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-cream/80 backdrop-blur-md border-b border-gray-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Row 1: Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Coffee className="w-6 h-6 text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-heading">Cafe</h1>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for food, coffee..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm font-sans"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-50 animate-fade-in-up">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.category.replace('-', ' ')}</p>
                  </div>
                  <span className="text-sm font-mono text-gray-600">₹{item.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
