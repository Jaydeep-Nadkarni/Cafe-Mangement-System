import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { initiatePayment } from '../utils/razorpay';
import { Check, AlertCircle, Loader2, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatCurrency';

export default function MobileNumberModal({ isOpen, onClose, onSubmit, orderData, paymentMethod }) {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateMobileNumber = (number) => {
    const cleanedNumber = number.replace(/\D/g, '');
    if (cleanedNumber.length !== 10) {
      setError('Mobile number must be 10 digits');
      return false;
    }
    if (!cleanedNumber.match(/^[6-9]/)) {
      setError('Mobile number must start with 6, 7, 8, or 9');
      return false;
    }
    return true;
  };

  // Save order to database
  const saveOrderToDatabase = async (customerName, customerPhone) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('OrderData received:', orderData);
      console.log('BranchCode:', orderData?.branchCode);
      console.log('TableNumber:', orderData?.tableNumber);
      
      // Prepare order items with item name for database lookup
      const orderItems = (orderData?.items || []).map(cartItem => ({
        menuItem: cartItem.item?.id,
        name: cartItem.item?.name,
        quantity: cartItem.quantity,
        price: cartItem.price,
        specialInstructions: ''
      }));

      const orderPayload = {
        branchCode: orderData?.branchCode,
        tableNumber: parseInt(orderData?.tableNumber),
        items: orderItems,
        customerCount: 1,
        customerName: customerName,
        customerPhone: customerPhone,
        chefNotes: orderData?.chefNotes || ''
      };

      console.log('Saving order to database:', orderPayload);

      // Validate payload
      if (!orderPayload.branchCode || !orderPayload.tableNumber || orderPayload.items.length === 0) {
        throw new Error(`Invalid order payload: branchCode=${orderPayload.branchCode}, tableNumber=${orderPayload.tableNumber}, items=${orderPayload.items.length}`);
      }

      const response = await axios.post(
        `${API_URL}/api/public/orders`,
        orderPayload
      );

      console.log('Order saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving order:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('Please enter a mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      return;
    }

    setIsSubmitting(true);

    const currentCart = { ...cart };
    const phoneNumber = mobileNumber.replace(/\D/g, '');
    const totalAmount = orderData?.totalAmount || 0;

    // Save order to database FIRST
    let savedOrder;
    try {
      savedOrder = await saveOrderToDatabase(customerName, phoneNumber);
    } catch (error) {
      setError('Failed to process order. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const orderId = savedOrder?.orderNumber || `ORD_${Date.now()}`;

    if (paymentMethod === 'cash') {
      clearCart();
      navigate('/payment-success', {
        state: {
          paymentData: {
            paymentId: 'CASH_' + Date.now(),
            orderId: orderId,
            method: 'cash',
            amount: totalAmount,
            customerName: customerName,
            customerPhone: phoneNumber,
            isAddedToExisting: savedOrder?.isExistingOrder || false
          },
          orderItems: currentCart,
          savedOrderId: savedOrder?._id
        },
      });
      setMobileNumber('');
      setCustomerName('');
      onClose();
      return;
    }

    try {
      // Initiate Razorpay payment
      initiatePayment({
        amount: totalAmount,
        orderId: orderId,
        customerName: customerName,
        customerEmail: orderData?.customerEmail || `${phoneNumber}@cafe.local`,
        customerPhone: phoneNumber,
        onSuccess: (paymentResponse) => {
          console.log('Payment successful:', paymentResponse);
          
          // Call backend to confirm payment
          fetch(`${API_URL}/api/public/orders/${savedOrder._id}/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethod: 'online',
              razorpayPaymentId: paymentResponse.razorpayPaymentId,
              razorpayOrderId: paymentResponse.razorpayOrderId,
              razorpaySignature: paymentResponse.razorpaySignature
            })
          })
          .then(res => res.json())
          .then(data => {
            console.log('Payment confirmed on backend:', data);
          })
          .catch(err => {
            console.error('Failed to confirm payment on backend:', err);
          });
          
          clearCart();
          // Navigate to success page with payment data
          navigate('/payment-success', {
            state: {
              paymentData: {
                ...paymentResponse,
                orderId: orderId,
                customerName: customerName,
                customerPhone: phoneNumber
              },
              orderItems: currentCart,
              savedOrderId: savedOrder?._id
            },
          });
          setMobileNumber('');
          setCustomerName('');
          onClose();
        },
        onFailure: (error) => {
          console.error('Payment failed:', error);
          setError(error.message || 'Payment failed. Please try again.');
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('Failed to initiate payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMobileNumber('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 animate-fade-in-up">
        <div
          className="bg-white rounded-3xl shadow-2xl p-5 md:p-8 max-w-md mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm & Pay
            </h2>
            <p className="text-sm text-gray-600">
              Enter your details to complete the payment
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setError('');
                }}
                className="w-full bg-gray-100 border-2 border-transparent rounded-2xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Country Code + Mobile Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="shrink-0 px-3 py-3 bg-gray-100 rounded-2xl flex items-center text-gray-600 font-semibold whitespace-nowrap">
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(value);
                    setError('');
                  }}
                  className="flex-1 min-w-0 bg-gray-100 border-2 border-transparent rounded-2xl px-3 md:px-4 py-3 text-base md:text-lg font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Character Count */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{mobileNumber.length}/10 digits</span>
              {mobileNumber.length === 10 && (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Valid
                </span>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 animate-fade-in-up flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || mobileNumber.length !== 10 || !customerName.trim()}
              className="w-full bg-linear-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold py-4 rounded-2xl transition-all duration-300 shadow-yellow hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 group mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{paymentMethod === 'cash' ? 'Placing Order...' : 'Opening Payment...'}</span>
                </>
              ) : (
                <>
                  <span>{paymentMethod === 'cash' ? 'Confirm Order' : `Pay ${formatCurrency(orderData?.totalAmount)}`}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <p>Your payment is secured by Razorpay. We never store card details.</p>
          </div>
        </div>
      </div>
    </>
  );
}
