import { useState } from 'react';
import { Sparkles, Coffee, Pizza, CakeSlice, CupSoda } from 'lucide-react';

export default function FilterChips() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'fast-food', label: 'Fast Food', icon: Pizza },
    { id: 'coffee', label: 'Coffee', icon: Coffee },
    { id: 'dessert', label: 'Desserts', icon: CakeSlice },
    { id: 'beverages', label: 'Beverages', icon: CupSoda },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
      {filters.map(filter => {
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 relative group flex items-center gap-2 ${
              activeFilter === filter.id
                ? 'bg-gradient-to-r from-primary to-primary-light text-gray-900 shadow-yellow'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
            {activeFilter !== filter.id && (
              <span className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}
