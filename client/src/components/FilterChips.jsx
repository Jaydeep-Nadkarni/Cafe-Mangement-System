import { useState } from 'react';

export default function FilterChips() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: '✨ All', count: 24 },
    { id: 'coffee', label: '☕ Coffee', count: 8 },
    { id: 'pastry', label: '🥐 Pastries', count: 6 },
    { id: 'sandwich', label: '🥪 Sandwiches', count: 5 },
    { id: 'dessert', label: '🍰 Desserts', count: 5 },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={`flex-shrink-0 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 relative group ${
            activeFilter === filter.id
              ? 'bg-gradient-to-r from-primary to-primary-light text-gray-900 shadow-yellow'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
          }`}
        >
          {filter.label}
          <span className={`ml-2 text-xs font-semibold ${
            activeFilter === filter.id ? 'text-gray-800' : 'text-gray-400'
          }`}>
            {filter.count}
          </span>
          {activeFilter !== filter.id && (
            <span className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </button>
      ))}
    </div>
  );
}
