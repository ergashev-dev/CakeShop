import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'right',
  className = '',
  ...props
}) => {
  const isBusy = isLoading || loading;
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    // Primary Blue #2563EB
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm border border-transparent active:bg-[#1E40AF]',
    // Secondary Clean White
    secondary:
      'bg-white dark:bg-[#1E2024] hover:bg-[#F7F8FA] dark:hover:bg-[#282A30] text-[#17181A] dark:text-[#F3F4F6] border border-[#E7E9ED] dark:border-[#2E3138] shadow-sm',
    // Outline
    outline:
      'bg-transparent border border-[#E7E9ED] dark:border-[#2E3138] text-[#17181A] dark:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#1E2024]',
    // Subtle Accent Light Blue
    accentLight:
      'bg-[#EFF6FF] dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 hover:bg-[#DBEAFE] dark:hover:bg-blue-900/50 border border-transparent',
    // Danger
    danger:
      'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 active:bg-red-200',
    // Ghost
    ghost:
      'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#1E2024]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      disabled={disabled || isBusy}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
