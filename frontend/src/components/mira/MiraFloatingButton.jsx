import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, MessageCircle } from 'lucide-react';

export const MiraFloatingButton = ({ isOpen, onClick, isEnabled = true }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // If AI Assistant is turned OFF by admin, do not render button (Requirement 8)
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pointer-events-auto select-none">
      {/* Tooltip on hover */}
      <div
        className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1A1D24]/95 border border-[#E5E7EB] dark:border-[#26282E] shadow-dropdown text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] transition-all duration-200 pointer-events-none ${
          isHovered && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <Sparkles className="w-3 h-3 text-[#2563EB] animate-pulse" />
        <span>{t('mira.tooltip', 'Miradan so‘rang')}</span>
      </div>

      {/* Main Floating Button */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Mira AI Yordamchisi"
        className={`group relative flex items-center gap-2 px-4 py-3 rounded-full bg-[#111827] dark:bg-[#1E222A] text-white border border-stone-800 dark:border-stone-700 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
          isOpen ? 'ring-2 ring-[#2563EB] bg-[#1E293B]' : 'hover:border-[#2563EB]/60'
        }`}
      >
        {/* Soft pulse ring */}
        {!isOpen && (
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xs -z-10 animate-pulse duration-1000" />
        )}

        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
        </div>

        <span className="text-xs font-bold tracking-tight">
          {t('mira.title', 'Mira')}
        </span>

        {/* Online tiny indicator */}
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      </button>
    </div>
  );
};

export default MiraFloatingButton;
