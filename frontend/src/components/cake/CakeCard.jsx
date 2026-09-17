import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check, Heart, Plus, Sparkles, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatters';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const CakeCard = ({ cake, className = '' }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const cakeId = cake._id || cake.id;
  const isFav = isFavorite(cakeId);

  // Toggle favorite with global WishlistContext
  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(cake);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cake, 1);
    setIsAdded(true);
    toast.success(`${cake.name} savatga qo‘shildi!`);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  // Honest pricing: Strictly check for real discounts in DB. Never fabricate old prices.
  const hasRealDiscount = Boolean(cake.oldPrice && cake.oldPrice > cake.price);
  const discountPercent = hasRealDiscount
    ? Math.round(((cake.oldPrice - cake.price) / cake.oldPrice) * 100)
    : (cake.discount || null);

  const isOutOfStock = cake.in_stock === false || cake.isActive === false;
  const displayRating = cake.average_rating
    ? Number(cake.average_rating).toFixed(1)
    : (cake.rating ? Number(cake.rating).toFixed(1) : '4.9');

  return (
    <div
      className={`group relative bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl overflow-hidden shadow-subtle hover:shadow-hover card-interactive hover:border-blue-500/30 dark:hover:border-blue-400/20 transition-all duration-300 flex flex-col justify-between ${
        isOutOfStock ? 'opacity-70 grayscale-[35%]' : ''
      } ${className}`}
    >
      <div>
        {/* Product Image Container */}
        <Link
          to={`/cakes/${cakeId}`}
          className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F4F6] dark:bg-[#1C1F26] block"
        >
          <img
            src={cake.image || DEFAULT_CAKE_IMAGE}
            alt={cake.name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            loading="lazy"
          />

          {/* Badges on Top-Left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
            {isOutOfStock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-700/90 text-white shadow-xs backdrop-blur-xs">
                {t('cake.out_of_stock', 'Tugagan')}
              </span>
            )}
            {cake.is_popular && !isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#EFF6FF] dark:bg-[#1E3A8A]/90 text-[#2563EB] dark:text-[#93C5FD] border border-[#BFDBFE]/60 dark:border-[#1E3A8A] shadow-xs uppercase tracking-wider shimmer-badge">
                <Sparkles className="w-2.5 h-2.5 animate-star-twinkle" /> {t('cake.popular', 'Mashhur')}
              </span>
            )}
            {hasRealDiscount && !isOutOfStock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-xs animate-pulse-subtle">
                {discountPercent ? `-${discountPercent}%` : t('cake.discount', 'Chegirma')}
              </span>
            )}
            {cake.category_name && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 dark:bg-[#16181D]/90 text-[#4B5563] dark:text-[#D1D5DB] border border-[#E5E7EB] dark:border-[#26282E] backdrop-blur-xs shadow-xs">
                {cake.category_name}
              </span>
            )}
          </div>

          {/* Wishlist Heart Button on Top-Right */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFav ? t('favorites.remove', "Sevimlilardan olib tashlash") : t('favorites.title', "Sevimlilarga qo‘shish")}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-subtle hover:scale-115 active:scale-90 ${
              isFav
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-white/90 dark:bg-[#16181D]/90 text-[#6B7280] hover:text-rose-500 dark:text-[#9CA3AF] dark:hover:text-rose-400 border border-[#E5E7EB] dark:border-[#26282E]'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-200 ${isFav ? 'fill-current scale-110 text-white' : ''}`} />
          </button>
        </Link>

        {/* Card Content */}
        <div className="p-4 sm:p-4.5">
          {/* Rating & Weight */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
            <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              <span>{displayRating}</span>
            </div>
            <span>{cake.weight ? `${cake.weight} ${t('cake.from', 'dan')}` : `1.5 kg ${t('cake.from', 'dan')}`}</span>
          </div>

          {/* Cake Title */}
          <Link to={`/cakes/${cakeId}`} className="block">
            <h3 className="font-semibold text-sm sm:text-base text-[#111827] dark:text-[#F3F4F6] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors line-clamp-1 mb-1">
              {cake.name}
            </h3>
          </Link>

          {/* Short Description */}
          {cake.description && (
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-1">
              {cake.description}
            </p>
          )}
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="p-4 sm:p-4.5 pt-0 mt-auto">
        <div className="pt-3 border-t border-[#F3F4F6] dark:border-[#24272D] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#9CA3AF] block leading-none mb-0.5 uppercase tracking-wider font-semibold">
              {t('cake.price', 'Narxi')}
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-[#111827] dark:text-[#F3F4F6]">
                {formatPrice(cake.price)}
              </span>
              {hasRealDiscount && (
                <span className="line-through text-xs text-[#9CA3AF] font-medium">
                  {formatPrice(cake.oldPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Ushbu tort vaqtincha sotuvda mavjud emas' : t('cake.add_to_cart', 'Savatga')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-subtle cursor-pointer scale-105'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white hover:shadow-md cursor-pointer active:scale-95 hover:scale-103 shadow-subtle'
            }`}
          >
            {isOutOfStock ? (
              <span>{t('cake.out_of_stock_btn', 'Tugagan')}</span>
            ) : isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5] animate-bounce-subtle" />
                <span>{t('cake.added', 'Qo‘shildi')}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('cake.add_to_cart', 'Savatga')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CakeCard;
