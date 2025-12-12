import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-primary">☕ Cafe</h1>
        </div>

        {/* Search Bar - Animated */}
        <form
          onSubmit={handleSearch}
          className={`flex-1 mx-4 transition-all duration-300 ${
            isSearchOpen ? 'max-w-md' : 'max-w-xs'
          }`}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => {
                if (!searchQuery) setIsSearchOpen(false);
              }}
              className={`w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ${
                isSearchOpen ? 'py-3 pl-12' : 'py-2.5 pl-4'
              }`}
            />
            <svg
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none transition-opacity duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Filter Button */}
        <button
          className="flex-shrink-0 p-2.5 hover:bg-gray-100 rounded-full transition-colors duration-200 ml-2"
          title="Filters"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
