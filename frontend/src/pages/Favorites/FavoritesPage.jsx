import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Star, Cake } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/formatters';
import { DEFAULT_CAKE_IMAGE, handleImageError } from '../../utils/imageFallback';
import EmptyState from '../../components/states/EmptyState';
import { CakeCardSkeleton } from '../../components/states/LoadingState';

const FavoritesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, wishlistCount, toggleFavorite, loading } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (cake) => {
    addToCart(cake, 1);
    toast.success(`${cake.name} ${t('cake_details.added_toast', 'savatga qo‘shildi!')}`);
    setIsCartOpen(true);
  };

  const handleRemove = (cake) => {
    toggleFavorite(cake);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Apple Bento Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{t('favorites.title', 'Sevimli Tortlarim')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17181A] dark:text-[#F3F4F6] tracking-tight flex items-center gap-3">
              <span>{t('favorites.title', 'Sevimli Tortlarim')}</span>
              {wishlistCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                  {wishlistCount}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              {t('favorites.subtitle', 'Siz yoqtirgan va keyinroq xarid qilish uchun saqlangan tortlar to‘plami')}
            </p>
          </div>

          <Link
            to="/cakes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
          >
            <span>{t('cake_details.back_to_catalog', 'Katalogga qaytish')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CakeCardSkeleton count={6} />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white/80 dark:bg-[#16181D]/80 backdrop-blur-md rounded-3xl border border-[#E7E9ED] dark:border-[#272A30] p-6 text-center max-w-lg mx-auto shadow-sm">
          <EmptyState
            type="favorites"
            onAction={() => navigate('/cakes')}
          />
        </div>
      ) : (
        /* Bento Grid of Favorite Cakes */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((cake) => {
            const cakeId = cake._id || cake.id;
            const price = cake.price || 0;

            return (
              <div
                key={cakeId}
                className="group relative bg-white/90 dark:bg-[#16181D]/90 backdrop-blur-md rounded-3xl border border-[#E7E9ED] dark:border-[#272A30] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF6F0] dark:bg-[#1F2227]">
                  <Link to={`/cakes/${cakeId}`}>
                    <img
                      src={cake.image || DEFAULT_CAKE_IMAGE}
                      alt={cake.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>

                  {/* Badges on Top-Left */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    {cake.is_popular && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" /> Hit
                      </span>
                    )}
                    {cake.categoryName && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 dark:bg-[#16181D]/90 text-[#44403C] dark:text-[#D6D3D1] border border-[#E7E5E4] dark:border-[#2E3138] backdrop-blur-xs">
                        {cake.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Remove Button on Top-Right */}
                  <button
                    onClick={() => handleRemove(cake)}
                    aria-label="Sevimlilardan o‘chirish"
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-[#16181D]/90 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#78716C] hover:text-rose-500 flex items-center justify-center backdrop-blur-md transition-all shadow-sm cursor-pointer hover:scale-110 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/cakes/${cakeId}`}>
                      <h3 className="font-bold text-base text-[#17181A] dark:text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors line-clamp-1 mb-1">
                        {cake.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2 mb-3">
                      {cake.description || 'Premium tabiiy masalliqlardan tayyorlangan betakror bayram shirinligi.'}
                    </p>
                  </div>

                  {/* Bottom Price & Add to Cart */}
                  <div className="pt-3 border-t border-[#F0F2F5] dark:border-[#24272D] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] uppercase font-bold">
                        {t('common.price', 'Narxi')}
                      </div>
                      <div className="text-sm font-bold text-[#17181A] dark:text-[#F3F4F6]">
                        {formatPrice(price)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(cake)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('catalog.add_to_cart', 'Savatga')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
