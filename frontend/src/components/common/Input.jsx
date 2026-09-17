import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      iconPosition = 'left',
      className = '',
      wrapperClassName = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3.5 pointer-events-none text-stone-400 dark:text-stone-500">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={`w-full rounded-xl bg-white dark:bg-[#18191E] border ${
              error
                ? 'border-red-500 focus:ring-red-400/30 focus:border-red-500'
                : 'border-stone-200 dark:border-stone-700/80 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-sm py-2.5 transition-all duration-200 outline-none ${
              Icon && iconPosition === 'left' ? 'pl-10' : 'pl-4'
            } ${Icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'} ${className}`}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3.5 pointer-events-none text-stone-400 dark:text-stone-500">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
