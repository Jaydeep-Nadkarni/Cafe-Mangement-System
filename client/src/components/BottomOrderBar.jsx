import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function BottomOrderBar() {
  const navigate = useNavigate();
  const { cart } = useCart();
  
  // Mock prices - in production, fetch from menu data
  const menuPrices = {
    1: 3.99, 2: 4.49, 3: 3.50, 4: 3.99, 5: 4.99,
    6: 6.99, 7: 5.99, 8: 7.99, 9: 4.49, 10: 3.99,
    11: 5.99, 12: 6.99
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      return total + (menuPrices[itemId] || 0) * quantity;
    }, 0);
  };

  const totalPrice = calculateTotal();
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const hasItems = totalItems > 0;

  return (
    <>
      {/* Slide-up animation overlay */}
      {hasItems && (
        <div className="fixed bottom-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-fade-in-up" />
      )}

      {/* Bottom Order Bar */}
      <div
        className={`fixed bottom-24 md:bottom-0 left-0 right-0 z-30 px-4 py-4 md:py-5 bg-white border-t border-gray-100 transition-all duration-300 transform ${
          hasItems
            ? 'translate-y-0 opacity-100 shadow-2xl shadow-gray-300/30 animate-fade-in-up'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Total Price Section */}
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-gray-500 font-medium">Total:</span>
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              ${totalPrice.toFixed(2)}
            </span>
            <span className="text-xs md:text-sm text-gray-500">
              ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Place Order Button */}
          <button onClick={() => navigate('/order-summary')} className="flex-shrink-0 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-gray-900 font-bold py-3 px-6 md:px-8 rounded-2xl transition-all duration-300 shadow-yellow hover:shadow-lg active:scale-95 flex items-center gap-2 group whitespace-nowrap">
            <span>Place Order</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Spacer for mobile to prevent content overlap */}
      {hasItems && <div className="h-20 md:h-0" />}
    </>
  );
}
