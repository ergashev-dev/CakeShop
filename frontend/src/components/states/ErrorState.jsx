import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldAlert,
  Clock,
  ServerCrash,
  WifiOff,
  LogIn,
} from 'lucide-react';
import Button from '../common/Button';

export const ErrorState = ({
  status,
  title,
  description,
  onRetry,
  onAction,
  actionLabel,
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();

  // Resolve defaults based on HTTP status code
  let resolvedTitle = title;
  let resolvedDesc = description;
  let StatusIcon = AlertTriangle;
  let showLogin = false;

  switch (status) {
    case 401:
      resolvedTitle = resolvedTitle || t('ux.errors.status_401_title', 'Login kerak');
      resolvedDesc = resolvedDesc || t('ux.errors.status_401_desc', 'Davom etish uchun tizimga kiring.');
      StatusIcon = Lock;
      showLogin = true;
      break;
    case 403:
      resolvedTitle = resolvedTitle || t('ux.errors.status_403_title', 'Ruxsat yo‘q');
      resolvedDesc = resolvedDesc || t('ux.errors.status_403_desc', 'Ushbu amalni bajarish uchun sizda yetarli ruxsat yo‘q.');
      StatusIcon = ShieldAlert;
      break;
    case 404:
      resolvedTitle = resolvedTitle || t('ux.errors.status_404_title', 'Resurs topilmadi');
      resolvedDesc = resolvedDesc || t('ux.errors.status_404_desc', 'So‘ralgan ma\'lumot serverda topilmadi.');
      break;
    case 408:
      resolvedTitle = resolvedTitle || t('ux.errors.status_408_title', 'Ulanish vaqti tugadi');
      resolvedDesc = resolvedDesc || t('ux.errors.status_408_desc', 'Server javob berishi uzoq davom etdi. Qayta urinib ko‘ring.');
      StatusIcon = Clock;
      break;
    case 429:
      resolvedTitle = resolvedTitle || t('ux.errors.status_429_title', 'Juda ko‘p so‘rov');
      resolvedDesc = resolvedDesc || t('ux.errors.status_429_desc', 'Iltimos, bir oz kuting va qayta urinib ko‘ring.');
      StatusIcon = Clock;
      break;
    case 500:
      resolvedTitle = resolvedTitle || t('ux.errors.status_500_title', 'Server xatosi');
      resolvedDesc = resolvedDesc || t('ux.errors.status_500_desc', 'Serverda kutilmagan nosozlik yuz berdi.');
      StatusIcon = ServerCrash;
      break;
    case 502:
    case 503:
      resolvedTitle = resolvedTitle || t('ux.errors.status_502_title', 'Server vaqtincha ishlamayapti');
      resolvedDesc = resolvedDesc || t('ux.errors.status_502_desc', 'Server yangilanmoqda yoki profilaktika ishlari olib borilmoqda.');
      StatusIcon = ServerCrash;
      break;
    default:
      resolvedTitle = resolvedTitle || t('ux.errors.general_title', 'Ma\'lumotlarni yuklab bo‘lmadi');
      resolvedDesc = resolvedDesc || t('ux.errors.general_desc', 'Server bilan bog‘lanishda muammo yuz berdi.');
      StatusIcon = AlertTriangle;
      break;
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#26282E] flex items-center justify-between gap-3 text-left ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusIcon className="w-4 h-4 text-[#6B7280] shrink-0" />
          <div className="truncate">
            <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] truncate">
              {resolvedTitle}
            </div>
            {resolvedDesc && (
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                {resolvedDesc}
              </div>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="p-1.5 rounded-lg text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-white dark:hover:bg-[#202328] transition-colors cursor-pointer shrink-0"
            title={t('ux.errors.btn_retry', 'Qayta urinish')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto animate-in fade-in duration-200 ${className}`}>
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-[#1A1D24] border border-stone-200 dark:border-[#26282E] text-stone-600 dark:text-stone-300 flex items-center justify-center shadow-xs">
        <StatusIcon className="w-6 h-6 stroke-[1.75]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">
          {resolvedTitle}
        </h3>
        {resolvedDesc && (
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-sm">
            {resolvedDesc}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center gap-3">
        {showLogin ? (
          <Button
            variant="primary"
            size="sm"
            icon={LogIn}
            onClick={onAction}
            className="shadow-xs"
          >
            {actionLabel || t('ux.errors.status_401_btn', 'Kirish')}
          </Button>
        ) : onRetry ? (
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={onRetry}
            className="shadow-xs"
          >
            {t('ux.errors.btn_retry', 'Qayta urinish')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default ErrorState;
