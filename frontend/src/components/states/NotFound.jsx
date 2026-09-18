import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import Button from '../common/Button';

export const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Apple-style minimalist icon badge */}
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-[#1A1D24] border border-stone-200/80 dark:border-[#272A30] text-[#2563EB] dark:text-[#60A5FA] mx-auto flex items-center justify-center shadow-xs">
          <Compass className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Clean, Refined 404 Typography */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#6B7280] dark:text-[#9CA3AF] uppercase block">
            {t('ux.not_found.code', '404')} — Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#F3F4F6]">
            {t('ux.not_found.title', 'Bu sahifa topilmadi')}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
            {t('ux.not_found.desc', 'Qidirayotgan sahifangiz mavjud emas yoki o‘chirib yuborilgan.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            icon={Home}
            onClick={() => navigate('/')}
            className="w-full sm:w-auto shadow-xs"
          >
            {t('ux.not_found.btn_home', 'Bosh sahifaga')}
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            {t('ux.not_found.btn_back', 'Orqaga')}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
