import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineState = () => {
  const { t } = useTranslation();
  const { isOnline, wasOffline } = useOnlineStatus();

  // If online and wasn't recently offline, render nothing
  if (isOnline && !wasOffline) {
    return null;
  }

  // If connection was just restored
  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white shadow-lg text-xs font-semibold select-none">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('ux.offline.restored', 'Internet aloqasi tiklandi')}</span>
        </div>
      </div>
    );
  }

  // When offline: Apple-style sleek floating banner
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] max-w-lg w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 py-2.5 rounded-2xl bg-[#111827] text-white dark:bg-stone-900 dark:border dark:border-stone-800 shadow-xl text-xs backdrop-blur-md">
        
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <WifiOff className="w-4 h-4 text-stone-400 shrink-0" />
          <div className="truncate">
            <span className="font-bold">{t('ux.offline.title', 'Internetga ulanmagan')}</span>
            <span className="hidden sm:inline text-stone-400 ml-1.5 font-normal">
              — {t('ux.offline.desc', 'Internet aloqangizni tekshiring va qayta urinib ko‘ring.')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium text-[11px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{t('ux.offline.btn_retry', 'Qayta urinish')}</span>
        </button>

      </div>
    </div>
  );
};

export default OfflineState;
