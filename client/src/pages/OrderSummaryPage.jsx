import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MobileNumberModal from '../components/MobileNumberModal';
import PaymentSelectionModal from '../components/PaymentSelectionModal';
import { ShoppingCart, Lightbulb, ArrowRight } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';

export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [finalAmount, setFinalAmount] = useState(0);

  // Redirect if no items in cart
  if (Object.keys(cart).length === 0) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 p-6 rounded-full">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 font-body">Add some delicious items to proceed</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  // Calculate pricing
  const subtotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const taxRate = 0.05; // 5% GST
  const tax = subtotal * taxRate;
  const totalBeforeDiscount = subtotal + tax;

  const handlePlaceOrder = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = (method, amount) => {
    setPaymentMethod(method);
    setFinalAmount(amount);
    setShowPaymentModal(false);
    setShowMobileModal(true);
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto pb-32">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-display">Order Summary</h1>
        <p className="text-gray-500 font-body">Review your order before payment</p>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl shadow-card p-6 md:p-8 mb-6 animate-fade-in-up border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Your Items</h2>
        <div className="space-y-6">
          {Object.entries(cart).map(([itemId, quantity]) => {
            const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
            if (!item) return null;
            const itemTotal = item.price * quantity;
            
            return (
              <div key={itemId} className="flex items-start justify-between group">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 font-display">{item.name}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">
                      {quantity} x ₹{item.price}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 font-mono">₹{itemTotal}</span>
              </div>
            );
          })}
        </div>
        
        <div className="my-6 border-t border-gray-100" />

        {/* Bill Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (5%)</span>
            <span className="font-mono">₹{tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 my-3 pt-3 flex justify-between items-end">
            <span className="font-bold text-gray-900 text-lg font-display">Total</span>
            <span className="font-bold text-gray-900 text-2xl font-mono">₹{totalBeforeDiscount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Gamification Tip */}
      <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 border border-primary/20 rounded-2xl p-4 mb-8 flex items-start gap-3 animate-fade-in-up delay-100">
        <div className="bg-white p-2 rounded-full shadow-sm">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-1">Did you know?</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            You can play mini-games while waiting for your order to win exclusive discounts on your next visit!
          </p>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
      >
        <span>Place Order</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Modals */}
      <PaymentSelectionModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subtotal={subtotal}
        tax={tax}
        onPaymentSelect={handlePaymentSelect}
      />

      {showMobileModal && (
        <MobileNumberModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          orderData={{
            totalAmount: finalAmount,
            orderId: `ORD_${Date.now()}`,
          }}
          paymentMethod={paymentMethod}
        />
      )}
    </div>
  );
}
