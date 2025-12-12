import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Coffee, Search, X, Filter } from 'lucide-react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync local state with URL param when on menu page
  useEffect(() => {
    if (location.pathname === '/menu') {
      const query = searchParams.get('search') || '';
      setSearchQuery(query);
    }
  }, [location.pathname, searchParams]);

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
    if (location.pathname !== '/menu' && searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bg-cream/80 backdrop-blur-md border-b border-gray-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Row 1: Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight font-heading">Cafe</h1>
          </div>
        </div>

        {/* Row 2: Search & Filter */}
        <div className="flex gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for food, coffee..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-sans"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (location.pathname === '/menu') setSearchParams({});
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            className="flex-shrink-0 bg-white border border-gray-200 p-3 rounded-2xl hover:border-primary hover:text-primary transition-colors shadow-sm"
            title="Filters"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
