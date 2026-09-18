import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Minus, Trash2 } from 'lucide-react';

export const MiraHeader = ({ onMinimize, onClose, onClearHistory }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1A1D24] flex items-center justify-between shrink-0 select-none">
      {/* Brand / Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              {t('mira.title', 'Mira')}
            </h4>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('mira.status_online', 'Onlayn')}
            </span>
          </div>
          <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-none">
            {t('mira.subtitle', 'Bol Tortlari AI yordamchisi')}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="p-1.5 text-[#9CA3AF] hover:text-rose-500 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#202328] transition-colors cursor-pointer"
            title={t('mira.clear_chat', 'Tarixni tozalash')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            className="p-1.5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#202328] transition-colors cursor-pointer"
            title="Kichraytirish"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#202328] transition-colors cursor-pointer"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MiraHeader;
