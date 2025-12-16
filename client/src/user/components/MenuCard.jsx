import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Sparkles } from 'lucide-react';
import AIOptionsModal from './AIOptionsModal';
import { formatCurrency } from '../../utils/formatCurrency';

export default function MenuCard({ item }) {
  // Guard against undefined item or missing required properties
  if (!item || !item.name) {
    return null;
  }

  const { addItem, removeItem, getQuantity, getItemPrice, getTotalQuantityForItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(item.sizes && item.sizes.length > 0 ? item.sizes[0].name : null);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Get quantity for current selection (with size if applicable)
  const quantity = getQuantity(item._id || item.id, selectedSize);
  const totalQuantity = item.sizes ? getTotalQuantityForItem(item._id || item.id) : quantity;
  
  // Get current price based on size
  const currentPrice = getItemPrice(item, selectedSize);

  const handleAdd = () => {
    addItem(item, selectedSize);
  };

  const handleRemove = () => {
    removeItem(item._id || item.id, selectedSize);
  };

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

          {/* Total quantity badge for items with sizes */}
          {item.sizes && totalQuantity > 0 && (
            <div className="absolute bottom-3 right-3 bg-primary text-gray-900 font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center shadow-md">
              {totalQuantity}
            </div>
          )}
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

          {/* Size Selector */}
          {item.sizes && (
            <div className="mb-3">
              <div className="flex gap-2">
                {item.sizes.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => setSelectedSize(size.name)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedSize === size.name
                        ? 'bg-primary text-gray-900 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{size.label}</span>
                      <span className="text-xs opacity-75">{formatCurrency(size.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price and Actions */}
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</span>
              <span className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(currentPrice)}</span>
            </div>

            {/* Quantity Selector */}
            <div className="shrink-0">
              {quantity === 0 ? (
                <button
                  onClick={handleAdd}
                  className="bg-primary hover:bg-primary-dark text-gray-900 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              ) : (
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={handleRemove}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 font-mono">{quantity}</span>
                  <button
                    onClick={handleAdd}
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
