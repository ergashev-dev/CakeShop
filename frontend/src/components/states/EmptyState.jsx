import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ShoppingBag,
  PackageOpen,
  Heart,
  Cake,
  ArrowRight,
} from 'lucide-react';
import Button from '../common/Button';

export const EmptyState = ({
  type = 'general', // 'search' | 'cart' | 'orders' | 'favorites' | 'products' | 'general'
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const { t } = useTranslation();

  let IconComponent = CustomIcon;
  let resolvedTitle = title;
  let resolvedDesc = description;
  let resolvedAction = actionLabel;

  switch (type) {
    case 'search':
      IconComponent = IconComponent || Search;
      resolvedTitle = resolvedTitle || t('ux.empty.search_title', 'Hech narsa topilmadi');
      resolvedDesc = resolvedDesc || t('ux.empty.search_desc', 'Boshqa so‘z bilan qidirib ko‘ring.');
      resolvedAction = resolvedAction || t('ux.empty.search_btn', 'Qidiruvni tozalash');
      break;

    case 'cart':
      IconComponent = IconComponent || ShoppingBag;
      resolvedTitle = resolvedTitle || t('ux.empty.cart_title', 'Savatchangiz bo‘sh');
      resolvedDesc = resolvedDesc || t('ux.empty.cart_desc', 'Mahsulotlarni tanlab savatchaga qo‘shing.');
      resolvedAction = resolvedAction || t('ux.empty.cart_btn', 'Katalogga o‘tish');
      break;

    case 'orders':
      IconComponent = IconComponent || PackageOpen;
      resolvedTitle = resolvedTitle || t('ux.empty.orders_title', 'Hozircha buyurtmalar yo‘q');
      resolvedDesc = resolvedDesc || t('ux.empty.orders_desc', 'Birinchi mazali tortingizga buyurtma bering.');
      resolvedAction = resolvedAction || t('ux.empty.orders_btn', 'Buyurtma berish');
      break;

    case 'favorites':
      IconComponent = IconComponent || Heart;
      resolvedTitle = resolvedTitle || t('ux.empty.favorites_title', 'Sevimlilar bo‘sh');
      resolvedDesc = resolvedDesc || t('ux.empty.favorites_desc', 'O‘zingizga yoqqan tortlarni saqlab qo‘ying.');
      resolvedAction = resolvedAction || t('ux.empty.favorites_btn', 'Katalogga o‘tish');
      break;

    case 'products':
      IconComponent = IconComponent || Cake;
      resolvedTitle = resolvedTitle || t('ux.empty.products_title', 'Hozircha mahsulotlar mavjud emas');
      resolvedDesc = resolvedDesc || t('ux.empty.products_desc', 'Tez orada yangi tortlar qo‘shiladi.');
      resolvedAction = resolvedAction || t('ux.empty.products_btn', 'Barcha toifalar');
      break;

    default:
      IconComponent = IconComponent || Cake;
      resolvedTitle = resolvedTitle || t('ux.empty.products_title', 'Ma\'lumot topilmadi');
      break;
  }

  return (
    <div className={`py-12 px-4 text-center flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto animate-in fade-in duration-200 ${className}`}>
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-[#F7F8FA] dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#26282E] text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-center shadow-xs">
        <IconComponent className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">
          {resolvedTitle}
        </h3>
        {resolvedDesc && (
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            {resolvedDesc}
          </p>
        )}
      </div>

      {onAction && resolvedAction && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            onClick={onAction}
            className="shadow-xs"
          >
            {resolvedAction}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
