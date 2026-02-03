import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0A0A0A] border border-[#262626] rounded-xl ${className}`}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className = ''
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  className?: string;
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 border border-transparent",
    secondary: "bg-[#262626] text-white hover:bg-[#333333] border border-transparent",
    outline: "border border-[#333333] text-gray-300 hover:text-white hover:border-gray-500 bg-transparent",
    ghost: "text-gray-400 hover:text-white hover:bg-[#111111]"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  onKeyDown
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={`w-full bg-transparent border border-[#262626] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors font-light ${className}`}
  />
);

export const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger', className?: string }) => {
  const styles = {
    default: "bg-[#262626] text-gray-200 border-transparent",
    outline: "bg-transparent text-gray-500 border-[#262626]",
    success: "bg-green-900/20 text-green-400 border-green-900/30",
    warning: "bg-yellow-900/20 text-yellow-400 border-yellow-900/30",
    danger: "bg-red-900/20 text-red-400 border-red-900/30"
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
