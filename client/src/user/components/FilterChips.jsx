import { Sparkles, Coffee, Pizza, CakeSlice, CupSoda, UtensilsCrossed, Sandwich, IceCream, Soup } from 'lucide-react';

// Map categories to icons
const categoryIcons = {
  'all': Sparkles,
  'coffee': Coffee,
  'fast-food': Pizza,
  'dessert': CakeSlice,
  'desserts': CakeSlice,
  'beverages': CupSoda,
  'drinks': CupSoda,
  'main-course': UtensilsCrossed,
  'snacks': Sandwich,
  'ice-cream': IceCream,
  'soup': Soup,
  'default': UtensilsCrossed
};

// Format category name for display
const formatCategoryLabel = (category) => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function FilterChips({ activeFilter, onFilterChange, categories = [] }) {
  // Create filters from categories prop, or use default
  const defaultFilters = [
    { id: 'all', label: 'All' },
    { id: 'fast-food', label: 'Fast Food' },
    { id: 'coffee', label: 'Coffee' },
    { id: 'dessert', label: 'Desserts' },
    { id: 'beverages', label: 'Beverages' },
  ];

  const filters = categories.length > 0
    ? [{ id: 'all', label: 'All' }, ...categories.map(cat => ({ id: cat, label: formatCategoryLabel(cat) }))]
    : defaultFilters;

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 md:px-0">
      {filters.map(filter => {
        const Icon = categoryIcons[filter.id] || categoryIcons['default'];
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
