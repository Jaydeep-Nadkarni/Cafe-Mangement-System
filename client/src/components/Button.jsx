import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  icon,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold text-center border-none cursor-pointer transition-all duration-300 whitespace-nowrap select-none outline-none relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-br from-primary to-primary-light text-gray-900 shadow-yellow hover:translate-y-[-2px] hover:shadow-[0_6px_16px_rgba(253,216,53,0.4)] active:translate-y-0',
    secondary: 'bg-white text-gray-900 border-2 border-gray-200 shadow-sm hover:border-primary hover:bg-primary/10 hover:translate-y-[-2px]',
    outline: 'bg-transparent text-gray-900 border-2 border-primary hover:bg-primary hover:translate-y-[-2px] hover:shadow-yellow',
    text: 'bg-transparent text-gray-900 shadow-none px-4 py-2 hover:text-primary-dark hover:bg-primary/10',
    danger: 'bg-red-500 text-white shadow-md hover:bg-red-700 hover:translate-y-[-2px]',
    success: 'bg-green-500 text-white shadow-md hover:bg-green-700 hover:translate-y-[-2px]'
  };

  const sizes = {
    small: 'px-4 py-2 text-sm rounded-2xl',
    medium: 'px-6 py-3 text-base rounded-2xl',
    large: 'px-8 py-4 text-lg rounded-2xl'
  };

  const buttonClasses = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.medium,
    fullWidth ? 'w-full flex' : '',
    disabled ? 'opacity-60 cursor-not-allowed transform-none shadow-none hover:transform-none hover:shadow-none' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;
