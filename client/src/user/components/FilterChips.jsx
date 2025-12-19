import { 
  Sparkles, Coffee, Wine, Droplets, Sun, Egg, 
  Sandwich, Beef, Cookie, Croissant, IceCream, 
  Cake, Salad, Milk, Star, UtensilsCrossed 
} from 'lucide-react';

// Map icon names to Lucide icons
const iconMap = {
  'coffee': Coffee,
  'glass-water': Droplets,
  'mug-hot': Sun,
  'egg-fried': Egg,
  'sandwich': Sandwich,
  'burger': Beef,
  'cookie': Cookie,
  'croissant': Croissant,
  'ice-cream': IceCream,
  'cake-slice': Cake,
  'salad': Salad,
  'glass': Wine,
  'milkshake': Milk,
  'star': Star,
  'default': UtensilsCrossed
};

export default function FilterChips({ activeFilter, onFilterChange, categories = [] }) {
  // Always include "All" filter
  const allFilter = { 
    id: 'all', 
    label: 'All', 
    icon: 'default',
    color: '#FBBF24' 
  };

  // Transform category objects to filter format
  const categoryFilters = categories.map(cat => ({
    id: cat.slug,
    label: cat.name,
    icon: cat.icon || 'default',
    color: cat.color || '#6B7280'
  }));

  const filters = [allFilter, ...categoryFilters];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
      {filters.map(filter => {
        const Icon = iconMap[filter.icon] || iconMap['default'];
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`shrink-0 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 relative group flex items-center gap-2 ${
              isActive
                ? 'text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
            }`}
            style={isActive ? { backgroundColor: filter.color } : {}}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
