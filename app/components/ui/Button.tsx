'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 border focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500 focus:ring-purple-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 focus:ring-slate-500',
    success: 'bg-green-500 hover:bg-green-600 text-white border-green-500 focus:ring-green-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 focus:ring-yellow-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-red-500 focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 sm:px-6 py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-4 text-base sm:text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
} 