import { useCart } from '../context/CartContext';
import { Plus, Minus, Trophy, Sparkles } from 'lucide-react';

export default function MenuCard({ item }) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);

  return (
    <div className="bg-white rounded-3xl shadow-card hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in-up h-full flex flex-col border border-gray-100">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 h-48 md:h-56">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        
        {/* Tag Badge */}
        {item.tag && (
          <div className="absolute top-3 left-3 bg-primary shadow-sm px-3 py-1 rounded-full">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{item.tag}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Gamification Badge */}
          <button
            className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm hover:bg-primary hover:text-gray-900 transition-all duration-300 group/game"
            title="Play to win discounts!"
          >
            <Trophy className="w-4 h-4 text-gray-900" />
          </button>
          
          {/* AI Button */}
          <button
            className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm hover:bg-primary hover:text-gray-900 transition-all duration-300 group/ai"
            title="Ask AI about this item"
          >
            <Sparkles className="w-4 h-4 text-gray-900" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Name and Description */}
        <div className="mb-3">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-display font-bold text-[var(--color-charcoal)] text-xl leading-tight line-clamp-2">
              {item.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 font-body leading-relaxed">{item.description}</p>
        </div>

        {/* Price and Actions */}
        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</span>
            <span className="text-2xl font-bold text-[var(--color-charcoal)] font-mono">₹{item.price}</span>
          </div>

          {/* Quantity Selector */}
          <div className="flex-shrink-0">
            {quantity === 0 ? (
              <button
                onClick={() => addItem(item)}
                className="bg-[var(--color-charcoal)] hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            ) : (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-charcoal)] hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-[var(--color-charcoal)] font-mono">{quantity}</span>
                <button
                  onClick={() => addItem(item)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-charcoal)] hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
