import { useState } from 'react';
import { Check, X, Tag, CreditCard, Banknote, ArrowRight } from 'lucide-react';

export default function PaymentSelectionModal({ isOpen, onClose, subtotal, tax, onPaymentSelect }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');

  if (!isOpen) return null;

  // Coupon discount - simple mock coupons
  const couponDiscounts = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'WELCOME5': 0.05
  };

  const discountRate = appliedCoupon ? couponDiscounts[appliedCoupon] || 0 : 0;
  const discountAmount = subtotal * discountRate;
  const total = subtotal + tax - discountAmount;

  const handleApplyCoupon = () => {
    if (couponInput.toUpperCase() in couponDiscounts) {
      setAppliedCoupon(couponInput.toUpperCase());
      setCouponInput('');
    } else {
      alert('Invalid coupon code');
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up overflow-hidden">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading mb-2">Order Placed!</h2>
          <p className="text-gray-500">Your order has been successfully placed.</p>
          <p className="text-sm text-gray-400 mt-1">Would you like to do anything else?</p>
        </div>

        {/* Coupon Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Apply Coupon
          </h3>
          
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary uppercase font-mono"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={!couponInput}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-bold text-green-800 text-xs">Applied: {appliedCoupon}</p>
                  <p className="text-[10px] text-green-600 font-mono">-₹{discountAmount.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="p-1.5 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-end mb-8 px-2">
          <span className="text-gray-500 font-medium">Total Amount</span>
          <span className="text-3xl font-bold text-gray-900 font-mono">₹{total.toFixed(0)}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onPaymentSelect('online', total)}
            className="w-full bg-primary hover:bg-primary-dark text-gray-900 font-bold py-4 rounded-2xl shadow-lg shadow-yellow/20 transition-all active:scale-95 flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" />
              <span>Pay Now</span>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onPaymentSelect('cash', total)}
            className="w-full bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5" />
              <span>Pay at Counter</span>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
