import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertCircle } from 'lucide-react';

export const MiraConfirmationCard = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#26282E] shadow-xs space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            isDangerous
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h5 className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] mb-0.5">
              {title}
            </h5>
          )}
          {description && (
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F3F4F6] dark:border-[#26282E]">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#202328] text-[#6B7280] dark:text-[#9CA3AF] text-[11px] font-semibold transition-colors cursor-pointer"
        >
          {cancelLabel || t('mira.btn_cancel', 'Bekor qilish')}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className={`px-3.5 py-1.5 rounded-xl text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 ${
            isDangerous
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
          }`}
        >
          <Check className="w-3 h-3" />
          <span>{confirmLabel || t('mira.btn_confirm', 'Ha, tasdiqlayman')}</span>
        </button>
      </div>
    </div>
  );
};

export default MiraConfirmationCard;
