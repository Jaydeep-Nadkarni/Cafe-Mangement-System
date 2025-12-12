import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ title = 'Cafe Management', showCart = true, cartCount = 0, searchQuery, setSearchQuery }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const searchInputRef = useRef(null);
  const location = useLocation();

  // Debounce search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (setSearchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search when navigating away or if not on menu page (optional, but good UX)
  useEffect(() => {
    if (location.pathname !== '/menu' && isSearchOpen) {
      setIsSearchOpen(false);
    }
  }, [location, isSearchOpen]);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // If opening, clear previous search if needed or keep it
    } else {
      // If closing, maybe clear search? Or keep it? 
      // Let's keep it for now, or clear it if user wants to "cancel" search.
      // Usually closing the search bar might imply clearing it, but let's just hide it.
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-white shadow-md z-50 h-[60px]">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
          <Link to="/" className="flex items-center gap-2 no-underline transition-transform duration-150 hover:scale-105">
            <span className="text-2xl flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-2xl shadow-yellow">☕</span>
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">{title}</span>
          </Link>
        </div>
        
        {/* Search Bar Container */}
        <div className={`flex-1 flex items-center justify-end transition-all duration-300 ${isSearchOpen ? 'w-full' : 'w-auto'}`}>
            {isSearchOpen ? (
              <div className="flex items-center w-full max-w-md mx-auto animate-fade-in">
                <div className="relative w-full flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full h-10 pl-4 pr-10 rounded-2xl border-2 border-primary bg-gray-50 text-gray-900 focus:outline-none focus:bg-white transition-colors"
                  />
                  <button 
                    onClick={() => {
                      setLocalSearch('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleSearchToggle}
                className="flex items-center justify-center w-10 h-10 rounded-2xl text-gray-600 hover:bg-gray-100 hover:text-primary-dark transition-all duration-200 mr-2"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
        </div>

        <div className={`flex items-center gap-4 transition-all duration-300 ${isSearchOpen ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'}`}>
          {showCart && (
            <Link to="/order-summary" className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gray-100 text-gray-900 transition-all duration-150 hover:bg-primary hover:-translate-y-0.5 hover:shadow-yellow">
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-sm">{cartCount}</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
