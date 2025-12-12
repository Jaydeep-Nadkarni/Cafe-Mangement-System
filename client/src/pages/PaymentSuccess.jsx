import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, paymentId } = location.state || {};

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-8">Thank you for your order. We've received your payment and are preparing your delicious food.</p>

        <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-mono font-medium text-gray-900">{orderId || 'ORD-12345-XYZ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Payment ID</span>
            <span className="font-mono font-medium text-gray-900">{paymentId || 'pay_123456789'}</span>
          </div>
        </div>

        <Button 
          variant="primary" 
          className="w-full justify-center py-3 text-lg"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
