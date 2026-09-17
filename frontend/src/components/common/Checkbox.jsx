import React from 'react';

/**
 * Checkbox - Professional, accessible, luxury animated checkbox component.
 * Replaces plain HTML checkboxes with modern SVG checkmark, smooth scaling,
 * focus rings, and dark mode support.
 */
export default function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  name,
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
}) {
  const inputId = id || (name ? `checkbox-${name}` : undefined);

  const boxSizes = {
    sm: 'w-4 h-4 rounded-md',
    md: 'w-5 h-5 rounded-lg',
    lg: 'w-6 h-6 rounded-lg',
  }[size] || 'w-5 h-5 rounded-lg';

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3.5 h-3.5';

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-3 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
        {/* Hidden native input for form accessibility */}
        <input
          type="checkbox"
          id={inputId}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            if (!disabled && onChange) {
              onChange(e);
            }
          }}
          className="sr-only peer"
        />

        {/* Custom Checkbox Box */}
        <div
          className={`flex items-center justify-center border transition-all duration-200 ${boxSizes} ${
            checked
              ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30'
              : 'bg-white dark:bg-[#1A1C22] border-[#D1D5DB] dark:border-[#374151] group-hover:border-[#2563EB] dark:group-hover:border-[#3B82F6]'
          } peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563EB]/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-[#111827]`}
        >
          {/* Animated SVG Checkmark */}
          <svg
            className={`${iconSizes} transition-all duration-200 stroke-current transform ${
              checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {(label || description) && (
        <div className="text-left">
          {label && (
            <div
              className={`text-xs md:text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6] transition-colors ${
                disabled ? '' : 'group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]'
              }`}
            >
              {label}
            </div>
          )}
          {description && (
            <div className="text-[11px] md:text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>
      )}
    </label>
  );
}
