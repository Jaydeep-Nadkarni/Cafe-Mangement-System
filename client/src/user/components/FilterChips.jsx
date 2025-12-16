import { Sparkles, Coffee, Pizza, CakeSlice, CupSoda } from 'lucide-react';

export default function FilterChips({ activeFilter, onFilterChange }) {
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
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`shrink-0 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 relative group flex items-center gap-2 ${
              isActive
                ? 'bg-primary text-gray-900 shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
