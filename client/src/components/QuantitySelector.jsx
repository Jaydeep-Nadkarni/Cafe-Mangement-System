import React from 'react';

const QuantitySelector = ({ 
  quantity = 1, 
  min = 1, 
  max = 99, 
  onChange,
  size = 'medium'
}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, value));
    onChange(clampedValue);
  };

  const sizeClasses = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-12'
  };

  const btnSizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const inputSizeClasses = {
    small: 'w-10 text-sm',
    medium: 'w-[50px] text-base',
    large: 'w-[60px] text-lg'
  };

  const iconSizeClasses = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center bg-white rounded-2xl shadow-sm overflow-hidden ${sizeClasses[size]}`}>
      <button
        type="button"
        className={`flex items-center justify-center bg-gray-100 border-none cursor-pointer transition-all duration-150 text-gray-900 hover:bg-primary hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${btnSizeClasses[size]}`}
        onClick={handleDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
      >
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <input
        type="number"
        className={`text-center border-none bg-white font-semibold text-gray-900 outline-none appearance-none ${inputSizeClasses[size]}`}
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        aria-label="Quantity"
      />
      
      <button
        type="button"
        className={`flex items-center justify-center bg-gray-100 border-none cursor-pointer transition-all duration-150 text-gray-900 hover:bg-primary hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${btnSizeClasses[size]}`}
        onClick={handleIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
      >
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default QuantitySelector;
