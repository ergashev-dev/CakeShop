import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn } from 'lucide-react';
import Button from '../common/Button';

export const SessionExpiredModal = ({ onLoginClick }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsOpen(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  if (!isOpen) return null;

  const handleLogin = () => {
    setIsOpen(false);
    onLoginClick && onLoginClick();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-[#16181D] border border-stone-200 dark:border-[#26282E] rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Apple-style minimalist lock badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 mx-auto flex items-center justify-center shadow-xs">
          <Lock className="w-6 h-6 stroke-[1.75]" />
        </div>

        <div className="space-y-1 px-2">
          <h3 className="text-base font-bold text-[#111827] dark:text-[#F3F4F6]">
            {t('ux.session.expired_title', 'Seansingiz tugadi')}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            {t('ux.session.expired_desc', 'Davom etish uchun qayta tizimga kiring.')}
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            icon={LogIn}
            onClick={handleLogin}
            className="w-full shadow-xs"
          >
            {t('ux.session.btn_login', 'Kirish')}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SessionExpiredModal;
