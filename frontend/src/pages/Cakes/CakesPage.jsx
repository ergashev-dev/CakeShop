import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, Cake as CakeIcon, Percent } from 'lucide-react';
import { cakeApi, categoryApi } from '../../services/api';
import CakeCard from '../../components/cake/CakeCard';
import CustomSelect from '../../components/common/CustomSelect';

const CakesPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [saleOnly, setSaleOnly] = useState(searchParams.get('sale') === 'true');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 2 rows of 4 items on desktop

  const getCategoryName = (cat) => {
    const lang = i18n.language || 'uz';
    if (lang === 'ru' && cat.name_ru) return cat.name_ru;
    if (lang === 'en' && cat.name_en) return cat.name_en;
    return cat.name_uz || cat.name || cat.title || '';
  };

  // Sync with searchParams on mount or param change
  useEffect(() => {
    const saleParam = searchParams.get('sale') === 'true';
    const catParam = searchParams.get('category');
    if (saleParam) setSaleOnly(true);
    if (catParam) setSelectedCategory(catParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cakesRes, catRes] = await Promise.all([
          cakeApi.getAll(),
          categoryApi.getAll(),
        ]);
        setCakes(cakesRes.data?.cakes || []);
        setCategories(catRes.data?.categories || []);
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAndSortedCakes = useMemo(() => {
    return cakes.filter((cake) => {
      // Sale only filter
      if (saleOnly) {
        const hasDiscount = Boolean(cake.discount || (cake.oldPrice && cake.oldPrice > cake.price));
        if (!hasDiscount) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches =
          cake.name.toLowerCase().includes(q) ||
          (cake.category_name && cake.category_name.toLowerCase().includes(q)) ||
          (cake.description && cake.description.toLowerCase().includes(q)) ||
          (cake.ingredients && cake.ingredients.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (cake.category_slug !== selectedCategory && cake.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return (b.salesCount || 0) - (a.salesCount || 0); // popular
    });
  }, [cakes, searchQuery, selectedCategory, saleOnly, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedCakes.length / itemsPerPage);
  const paginatedCakes = filteredAndSortedCakes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleSaleToggle = () => {
    const nextSale = !saleOnly;
    setSaleOnly(nextSale);
    setCurrentPage(1);
    if (nextSale) {
      searchParams.set('sale', 'true');
    } else {
      searchParams.delete('sale');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-[#FBFBFC] dark:bg-[#0F1012] text-[#111827] dark:text-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-xs font-semibold border border-[#BFDBFE]/60 dark:border-[#1E3A8A] mb-3">
            <span>{t('brand.tagline', 'Bol Tortlari Katalogi')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            {saleOnly ? t('hero.badge', 'Chegirmadagi Tortlar va Aksiyalar') : t('catalog.title', 'Barcha Tortlar Katalogi')}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            {t('catalog.subtitle', 'Har bir bayram va oilaviy tantana uchun 100% tabiiy va yangi pishirilgan tortlar.')}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-4 sm:p-5 shadow-subtle mb-8 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('catalog.search_placeholder', 'Tort nomi bo‘yicha qidirish...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] outline-none focus:border-[#2563EB] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills & Sale Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 lg:pb-0 no-scrollbar">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all' && !saleOnly
                  ? 'bg-[#2563EB] text-white shadow-subtle'
                  : 'bg-[#F3F4F6] dark:bg-[#1F2228] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
              }`}
            >
              {t('catalog.all_categories', 'Barchasi')} ({cakes.length})
            </button>

            {/* Sale filter pill */}
            <button
              onClick={handleSaleToggle}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                saleOnly
                  ? 'bg-rose-600 text-white shadow-subtle'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>{t('cake.discount', 'Aksiyalar')}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.slug && !saleOnly
                    ? 'bg-[#2563EB] text-white shadow-subtle'
                    : 'bg-[#F3F4F6] dark:bg-[#1F2228] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {getCategoryName(cat)}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full lg:w-56 shrink-0 justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              size="sm"
              className="w-full"
              options={[
                { value: 'popular', label: t('catalog.sort_popular', 'Eng ommabop') },
                { value: 'price_asc', label: t('catalog.sort_price_asc', 'Arzonroq') },
                { value: 'price_desc', label: t('catalog.sort_price_desc', 'Qimmatroq') },
              ]}
            />
          </div>
        </div>

        {/* 4-Column Responsive Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl h-84 animate-pulse"
              />
            ))}
          </div>
        ) : paginatedCakes.length === 0 ? (
          <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-16 text-center shadow-card">
            <CakeIcon className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[#111827] dark:text-[#F3F4F6]">
              {t('catalog.no_cakes', 'Mos keluvchi tortlar topilmadi')}
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-sm mx-auto mb-4">
              {t('common.no_data', 'Qidiruv so‘zini o‘zgartirib ko‘ring yoki barcha tortlarni ko‘rish uchun filtrlarni tozalang.')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSaleOnly(false);
                setSearchParams({});
              }}
              className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              {t('catalog.reset_filter', 'Filtrlarni tozalash')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCakes.map((cake) => (
              <CakeCard key={cake._id || cake.id} cake={cake} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-[#2563EB] text-white shadow-subtle'
                    : 'bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F3F4F6]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CakesPage;
