import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium select-none rounded-md';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const variantStyles = {
    primary:
      'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60 dark:bg-[#1E3A8A]/30 dark:text-[#93C5FD]',
    secondary:
      'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] dark:bg-[#202328] dark:text-[#9CA3AF]',
    success:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    warning:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    danger:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      )}
      {children}
    </span>
  );
};

export default Badge;
