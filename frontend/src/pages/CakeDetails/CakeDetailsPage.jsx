import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ArrowLeft,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Clock,
  Heart,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cakeApi, reviewApi } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import CakeCard from '../../components/cake/CakeCard';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const CakeDetailsPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { addToCart, setIsCartOpen } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { toast } = useToast();

  const [cake, setCake] = useState(null);
  const [relatedCakes, setRelatedCakes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState('1.5 kg');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'allergens' | 'prep' | 'delivery' | 'reviews'

  useEffect(() => {
    const fetchCake = async () => {
      try {
        setLoading(true);
        const [cakesRes, reviewsRes] = await Promise.all([
          cakeApi.getAll(),
          reviewApi.getAll().catch(() => ({ data: { reviews: [] } })),
        ]);
        const all = cakesRes.data?.cakes || [];
        const found = all.find((c) => c._id === id || c.id === id) || all[0];
        setCake(found);
        if (found) {
          setActiveImage(found.image || '/hero-cake.jpg');
        }
        setRelatedCakes(all.filter((c) => c._id !== id && c.id !== id).slice(0, 4));
        setReviews(reviewsRes.data?.reviews || []);
      } catch (err) {
        console.error('Error fetching cake details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCake();
    window.scrollTo(0, 0);
  }, [id]);

  const weightOptions = [
    { label: '1.0 kg', servings: `4–6 ${t('cake_details.servings', 'kishi')}`, multiplier: 0.8 },
    { label: '1.5 kg', servings: `8–10 ${t('cake_details.servings', 'kishi')}`, multiplier: 1 },
    { label: '2.0 kg', servings: `12–15 ${t('cake_details.servings', 'kishi')}`, multiplier: 1.35 },
    { label: '3.0 kg', servings: `18–22 ${t('cake_details.servings', 'kishi')}`, multiplier: 1.95 },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-white dark:bg-[#16181D] rounded-2xl h-96 animate-pulse" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold mb-2">{t('catalog.no_cakes', 'Tort topilmadi')}</h2>
        <Link to="/cakes" className="text-sm font-semibold text-[#2563EB]">
          {t('cake_details.back_to_catalog', 'Katalogga qaytish')}
        </Link>
      </div>
    );
  }

  const cakeId = cake._id || cake.id;
  const isFav = isFavorite(cakeId);

  const currentOption =
    weightOptions.find((w) => w.label === selectedWeight) || weightOptions[1];
  const unitPrice = Math.round((cake.price * currentOption.multiplier) / 1000) * 1000;
  const totalPrice = unitPrice * quantity;

  const galleryImages = [
    cake.image,
    '/cake_strawberry.jpg',
    '/cake_chocolate.jpg',
    '/hero-cake.jpg',
  ].filter(Boolean);

  const handleAddToCart = () => {
    addToCart(
      {
        ...cake,
        price: unitPrice,
        weight: selectedWeight,
      },
      quantity
    );
    setIsAdded(true);
    toast.success(`${cake.name} (${selectedWeight}) ${t('cake_details.added_toast', 'savatga qo‘shildi!')}`);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="py-6 sm:py-10 bg-[#FBFBFC] dark:bg-[#0F1012] min-h-screen text-[#111827] dark:text-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs & Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/cakes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('cake_details.back_to_catalog', 'Katalogga qaytish')}</span>
          </Link>
          <div className="text-xs text-[#9CA3AF]">
            {t('nav.cakes', 'Katalog')} / {cake.category_name || 'Tort'} / {cake.name}
          </div>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* LEFT: Product Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible shrink-0 no-scrollbar">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === img
                      ? 'border-[#2563EB] ring-2 ring-[#BFDBFE] dark:ring-[#1E3A8A]'
                      : 'border-[#E5E7EB] dark:border-[#26282E] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img || DEFAULT_CAKE_IMAGE}
                    alt={`${cake.name} rasm ${i + 1}`}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Active Image Showcase */}
            <div className="flex-1 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl overflow-hidden shadow-card aspect-4/3 flex items-center justify-center relative group">
              <img
                src={activeImage || DEFAULT_CAKE_IMAGE}
                alt={cake.name}
                onError={handleImageError}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {cake.is_popular && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A] text-[#2563EB] dark:text-[#93C5FD] text-xs font-bold border border-[#BFDBFE]/60 dark:border-[#1E3A8A] shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Mashhur
                </span>
              )}

              {/* Wishlist toggle button */}
              <button
                type="button"
                onClick={() => toggleFavorite(cake)}
                className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-subtle ${
                  isFav
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/90 dark:bg-[#16181D]/90 text-[#6B7280] hover:text-rose-500 border border-[#E5E7EB] dark:border-[#26282E]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* RIGHT: Product Buy Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider block">
                    {cake.category_name || 'Premium Tort'}
                  </span>
                  {(cake.in_stock === false || cake.isActive === false) && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-700 text-white text-[10px] font-bold">
                      Tugagan
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                  {cake.name}
                </h1>
                
                {/* Rating & Review Info */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                    <span className="ml-1 text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">
                      {reviews.length > 0
                        ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                        : (cake.rating ? Number(cake.rating).toFixed(1) : '4.9')}
                    </span>
                  </div>
                  <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    ({reviews.length} {t('cake_details.reviews_count', 'ta haqiqiy sharh')})
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Halol & Tabiiy
                  </span>
                </div>
              </div>

              {/* Price card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] shadow-subtle flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#9CA3AF] block">
                    {t('cake.price', 'Narxi')} ({selectedWeight})
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#2563EB]">
                    {unitPrice.toLocaleString()} so‘m
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {t('common.ready', 'Buyurtmaga tayyor')}
                </span>
              </div>

              {/* Weight Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider">
                    {t('cake_details.select_weight', 'Vaznni tanlang')}
                  </label>
                  <span className="text-xs text-[#6B7280]">
                    {currentOption.servings}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {weightOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedWeight(opt.label)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedWeight === opt.label
                          ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] ring-1 ring-[#2563EB]'
                          : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">{opt.servings}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector & Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#E5E7EB] dark:border-[#26282E] rounded-xl bg-white dark:bg-[#16181D] p-1 shadow-subtle">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base hover:bg-[#F3F4F6] dark:hover:bg-[#202328] cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base hover:bg-[#F3F4F6] dark:hover:bg-[#202328] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={cake.in_stock === false || cake.isActive === false}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${
                      cake.in_stock === false || cake.isActive === false
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {cake.in_stock === false || cake.isActive === false
                        ? 'Hozirda mavjud emas (Tugagan)'
                        : isAdded
                        ? t('cake.added', 'Savatga qo‘shildi!')
                        : `${t('cake_details.add_to_cart', 'Savatga qo‘shish')} • ${totalPrice.toLocaleString()} so‘m`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <div className="pt-2 text-xs leading-relaxed text-[#4B5563] dark:text-[#9CA3AF]">
                <p>{cake.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABBED DETAILS SECTION */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 sm:p-8 shadow-subtle mb-16">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#26282E] pb-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'ingredients', label: t('cake_details.ingredients', 'Masalliqlar (Tarkibi)') },
              { id: 'allergens', label: t('cake_details.allergens', 'Allergenlar') },
              { id: 'prep', label: t('cake_details.prep_time', 'Tayyorlanish vaqti') },
              { id: 'delivery', label: t('cart.delivery_fee', 'Yetkazib berish') },
              { id: 'reviews', label: `${t('cake_details.reviews', 'Sharhlar')} (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD]'
                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {activeTab === 'ingredients' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-3xl">
                <h4 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-base">
                  100% Tabiiy Ingredientlar
                </h4>
                <p>
                  {cake.ingredients ||
                    '82.5% li tabiiy sariyog‘, toza qaymoq (cream cheese), Belgiya shokoladi, yangi mevalar va tabiiy tog‘ asali. Mahsulotlarimizda maragarin, sun’iy aromatizatorlar yoki zararli konservantlar mutlaqo qo‘llanilmaydi.'}
                </p>
                <div className="flex items-center gap-2 pt-2 text-emerald-600 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Halol standartlari asosida sertifikatlangan.</span>
                </div>
              </div>
            )}

            {activeTab === 'allergens' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-3xl">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Allergiya haqida ogohlantirish</span>
                </div>
                <p>
                  Tarkibida sut mahsulotlari (qaymoq, sut, sariyog‘), tuxum, bug‘doy uni (glyuten) va yong‘oq izlari bo‘lishi mumkin. Agar sizda biron mahsulotga individual allergiya bo‘lsa, buyurtma izohida ko‘rsatib o‘ting.
                </p>
              </div>
            )}

            {activeTab === 'prep' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-3xl">
                <div className="flex items-center gap-2 text-[#2563EB] font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Pishirish va tayyorlash jarayoni</span>
                </div>
                <p>
                  Har bir tort mijoz buyurtmasidan keyin yangi pishiriladi. Standart tortlar 3–5 soat ichida, murakkab bezakli va qavatli tortlar esa 24 soat oldin buyurtma qilinishi tavsiya etiladi.
                </p>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-3xl">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <Truck className="w-4 h-4" />
                  <span>Xavfsiz va sovutgichli yetkazib berish</span>
                </div>
                <p>
                  Tortlar maxsus harorat nazorati va fiksatsiyalangan sovutgichli mashinalarda yetkaziladi. 300 000 so‘mdan yuqori buyurtmalar shahar bo‘ylab mutlaqo bepul yetkaziladi.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#6B7280]">Hozircha ushbu tortga sharh qoldirilmagan.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.slice(0, 4).map((r) => (
                      <div
                        key={r._id}
                        className="p-4 rounded-xl bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#111827] dark:text-[#F3F4F6]">
                            {r.userName}
                          </span>
                          <div className="flex items-center text-amber-500">
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
                          «{r.comment}»
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedCakes.length > 0 && (
          <div className="pt-6">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">
              {t('popular.title', 'Sizga yoqishi mumkin bo‘lgan boshqa tortlar')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedCakes.map((c) => (
                <CakeCard key={c._id || c.id} cake={c} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CakeDetailsPage;
