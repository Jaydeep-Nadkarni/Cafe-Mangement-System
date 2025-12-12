import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Sparkles } from 'lucide-react';
import AIOptionsModal from './AIOptionsModal';

export default function MenuCard({ item }) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <>
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

          {/* AI Button Only */}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-sm hover:bg-primary hover:scale-110 transition-all duration-300"
              title="AI options for this item"
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
              <h3 className="font-display font-bold text-gray-900 text-xl leading-tight line-clamp-2">
                {item.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 font-body leading-relaxed">{item.description}</p>
          </div>

          {/* Price and Actions */}
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</span>
              <span className="text-2xl font-bold text-gray-900 font-mono">₹{item.price}</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex-shrink-0">
              {quantity === 0 ? (
                <button
                  onClick={() => addItem(item)}
                  className="bg-primary hover:bg-primary-dark text-gray-900 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              ) : (
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 font-mono">{quantity}</span>
                  <button
                    onClick={() => addItem(item)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Options Modal */}
      <AIOptionsModal
        item={item}
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </>
  );
}
