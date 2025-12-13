// Razorpay Integration Utility
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}) => {
  // Load Razorpay script if not already loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    onFailure(new Error('Failed to load Razorpay'));
    return;
  }

  // Check if Razorpay object exists
  if (!window.Razorpay) {
    onFailure(new Error('Razorpay is not available'));
    return;
  }

  try {
    // Get Razorpay key from environment variables (Vite uses import.meta.env)
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Rr3Tw4ut1jLQJc';

    // Razorpay configuration - using simplified checkout (no backend order required)
    const options = {
      key: razorpayKey,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Cafe Management System',
      description: `Order #${orderId}`,
      
      // Customer details
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },

      // Theme
      theme: {
        color: '#FDD835', // Yellow primary color
      },

      // Success callback
      handler: function (response) {
        console.log('Payment successful:', response);
        onSuccess({
          razorpayPaymentId: response.razorpay_payment_id,
          orderId: orderId,
          amount: amount,
          timestamp: new Date().toISOString(),
        });
      },

      // Modal closed callback
      modal: {
        ondismiss: function () {
          console.log('Payment modal closed');
          onFailure(new Error('Payment cancelled by user'));
        },
      },

      // Additional notes
      notes: {
        orderId: orderId,
        customerPhone: customerPhone,
      },
    };

    // Open Razorpay modal
    const rzp = new window.Razorpay(options);

    // Handle payment errors
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      onFailure(new Error(response.error.description || 'Payment failed'));
    });

    rzp.open();
  } catch (error) {
    console.error('Payment initiation error:', error);
    onFailure(error);
  }
};

// Verify payment signature on backend (call this after successful payment)
export const verifyPaymentSignature = async (paymentData) => {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const result = await response.json();
    return result.verified;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};
