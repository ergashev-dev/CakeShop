import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatters';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

export const MiraProductCard = ({ cake, onAddToCart, onSelect }) => {
  const { t } = useTranslation();
  if (!cake) return null;

  return (
    <div className="bg-white dark:bg-[#1A1D24] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-3 shadow-xs hover:border-[#2563EB]/50 transition-all flex items-center gap-3 group">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F3F4F6] dark:bg-[#111317] shrink-0 border border-[#E5E7EB] dark:border-[#26282E]">
        <img
          src={cake.image || DEFAULT_CAKE_IMAGE}
          alt={cake.name}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {cake.is_popular && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center gap-0.5">
            <Star className="w-2 h-2 fill-white" /> Xit
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/cakes/${cake._id || cake.id}`}
          onClick={onSelect}
          className="font-semibold text-xs text-[#111827] dark:text-[#F3F4F6] hover:text-[#2563EB] transition-colors truncate block"
          title={cake.name}
        >
          {cake.name}
        </Link>
        <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] block truncate">
          {cake.category_name || 'Tort'} • {cake.weight || '1.5 kg'}
        </span>
        <div className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] mt-1">
          {formatPrice(cake.price)}
        </div>
      </div>

      {/* Add To Cart CTA */}
      <button
        type="button"
        onClick={() => onAddToCart && onAddToCart(cake)}
        className="px-2.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
        title={t('mira.btn_add_to_cart', 'Savatga qo‘shish')}
      >
        <ShoppingBag className="w-3 h-3" />
        <span className="hidden sm:inline">{t('mira.btn_add_to_cart', 'Savatga')}</span>
      </button>
    </div>
  );
};

export default MiraProductCard;
