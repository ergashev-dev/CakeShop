import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

export const MiraTyping = ({ text }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-2.5 max-w-[85%] animate-in fade-in duration-200">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      <div className="p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#1E2026] text-[#111827] dark:text-[#F3F4F6] rounded-tl-xs flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" />
        </div>
        <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
          {text || t('mira.typing', 'Mira yozmoqda...')}
        </span>
      </div>
    </div>
  );
};

export default MiraTyping;
