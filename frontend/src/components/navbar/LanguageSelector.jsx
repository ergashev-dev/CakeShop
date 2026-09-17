import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const languages = [
  { code: 'uz', name: "O'zbekcha", short: 'UZ' },
  { code: 'ru', name: 'Русский', short: 'RU' },
  { code: 'en', name: 'English', short: 'EN' },
];

const LanguageSelector = ({ variant = 'dropdown' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs">
        {languages.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
              }`}
            >
              {lang.short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-white dark:bg-[#16181D] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <span>{currentLang.short}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6B7280] dark:text-[#9CA3AF] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl shadow-dropdown p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs tracking-normal text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'font-semibold text-[#2563EB] dark:text-[#93C5FD] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30'
                    : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                }`}
              >
                <span>{lang.name}</span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-[#2563EB] dark:text-[#93C5FD]' : 'text-[#9CA3AF]'}`}>
                  {lang.short}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
