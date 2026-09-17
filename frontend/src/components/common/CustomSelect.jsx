import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * CustomSelect - Luxury, accessible, responsive dropdown replacing native <select><option>
 * Renders dropdown menu via createPortal at document.body level to avoid clipping by
 * table overflow-x-auto or modal boundaries.
 * Supports auto-positioning (drop-up when near screen/container bottom), keyboard nav,
 * dark & light mode, icons, and badges.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Tanlang...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  size = 'md', // 'sm', 'md', 'lg'
  direction = 'auto', // 'auto', 'down', 'up'
  id,
  name,
  label,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options to { value, label, icon, badge }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label !== undefined ? opt.label : opt.value,
        icon: opt.icon || null,
        badge: opt.badge || null,
      };
    }
    return { value: opt, label: String(opt), icon: null, badge: null };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Compute position relative to viewport
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeightEstimate = Math.min(Math.max(normalizedOptions.length * 40 + 16, 60), 240);

    const shouldOpenUp =
      direction === 'up' ||
      (direction === 'auto' && spaceBelow < menuHeightEstimate && spaceAbove >= menuHeightEstimate);

    // Ensure left does not overflow screen
    const minWidth = Math.max(rect.width, 150);
    let left = rect.left;
    if (left + minWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - minWidth - 12);
    }

    setCoords({
      top: shouldOpenUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width: Math.max(rect.width, 150),
      openUp: shouldOpenUp,
    });
  }, [direction, normalizedOptions.length]);

  // Handle outside click and scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e) => {
      // If user is scrolling inside the dropdown itself, don't close
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      // Recalculate position on scroll
      updatePosition();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-10 px-3.5 text-sm',
    lg: 'h-12 px-4 text-base',
  }[size] || 'h-10 px-3.5 text-sm';

  // Dropdown portal menu element
  const dropdownMenu = isOpen && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: `${coords.left}px`,
          width: `${coords.width}px`,
          minWidth: '150px',
          maxWidth: '360px',
          zIndex: 99999,
          ...(coords.openUp
            ? { bottom: `${window.innerHeight - coords.top}px` }
            : { top: `${coords.top}px` }),
        }}
        className={`max-h-60 overflow-y-auto overflow-x-hidden rounded-xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] shadow-2xl py-1.5 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
        role="listbox"
      >
        {normalizedOptions.length === 0 ? (
          <div className="px-3.5 py-2.5 text-xs text-[#9CA3AF] text-center">
            Tanlovlar mavjud emas
          </div>
        ) : (
          normalizedOptions.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={String(option.value)}
                onClick={() => handleSelect(option.value)}
                className={`group relative flex items-center justify-between gap-2 px-3.5 py-2 text-xs md:text-sm cursor-pointer select-none transition-colors duration-150 ${
                  isSelected
                    ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-semibold'
                    : 'text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="flex items-center gap-2 truncate min-w-0 flex-1">
                  {option.icon && (
                    <span className="flex-shrink-0 text-[#6B7280] dark:text-[#9CA3AF] group-hover:text-[#2563EB]">
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {option.badge && (
                    <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-[#26282E] text-gray-600 dark:text-gray-300">
                      {option.badge}
                    </span>
                  )}
                </span>

                {isSelected && (
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-[#2563EB] dark:text-[#93C5FD] ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`relative inline-block w-full text-left ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] mb-1.5 truncate">
          {label}
        </label>
      )}

      {/* Hidden input for forms */}
      {name && <input type="hidden" name={name} id={id} value={value || ''} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-xl font-medium transition-all duration-200 border text-left outline-none select-none ${sizeClasses} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
            : isOpen
            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white dark:bg-[#16181D] text-[#111827] dark:text-[#F3F4F6]'
            : 'bg-white dark:bg-[#16181D] hover:bg-[#F9FAFB] dark:hover:bg-[#1E2026] border-[#E5E7EB] dark:border-[#26282E] text-[#111827] dark:text-[#F3F4F6] hover:border-[#2563EB]/50'
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-[#2563EB] dark:text-[#60A5FA]">{selectedOption.icon}</span>
          )}
          <span className="truncate text-[#111827] dark:text-[#F3F4F6] font-medium">
            {selectedOption ? selectedOption.label : <span className="text-[#9CA3AF]">{placeholder}</span>}
          </span>
          {selectedOption?.badge && (
            <span className="ml-1.5 flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD]">
              {selectedOption.badge}
            </span>
          )}
        </span>

        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#2563EB] dark:text-[#60A5FA]' : 'text-[#9CA3AF]'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Render Portal Menu */}
      {dropdownMenu}
    </div>
  );
}
