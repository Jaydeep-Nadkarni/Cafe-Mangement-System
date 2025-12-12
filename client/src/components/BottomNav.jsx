import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'menu', label: 'Menu', icon: '🍽️', path: '/menu' },
    { id: 'games', label: 'Games', icon: '🎮', path: '/games' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg shadow-gray-200/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-4 px-6 transition-all duration-300 relative group ${
                isActive(tab.path)
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {/* Active indicator bar */}
              {isActive(tab.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light rounded-t-lg animate-fade-in-up" />
              )}

              {/* Icon */}
              <span className="text-2xl md:text-3xl transition-transform duration-300 group-hover:scale-110">
                {tab.icon}
              </span>

              {/* Label */}
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>

              {/* Ripple effect on hover */}
              <span className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
