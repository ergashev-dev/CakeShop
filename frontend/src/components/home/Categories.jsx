import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../services/api';

const Categories = ({ activeCategory, onSelectCategory }) => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);

  const getCategoryName = (cat) => {
    const lang = i18n.language || 'uz';
    if (lang === 'ru' && cat.name_ru) return cat.name_ru;
    if (lang === 'en' && cat.name_en) return cat.name_en;
    return cat.name_uz || cat.name || '';
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        setCategories(res.data?.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
          activeCategory === 'all'
            ? 'bg-[#2563EB] text-white shadow-sm border border-[#2563EB]'
            : 'bg-white dark:bg-[#16181D] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] border border-[#E7E9ED] dark:border-[#272A30]'
        }`}
      >
        <span>{t('catalog.all_categories', 'Barchasi')}</span>
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;

        return (
          <button
            key={cat._id || cat.slug}
            onClick={() => onSelectCategory(cat.slug)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#2563EB] text-white shadow-sm border border-[#2563EB]'
                : 'bg-white dark:bg-[#16181D] text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-[#F3F4F6] hover:bg-[#F7F8FA] dark:hover:bg-[#202328] border border-[#E7E9ED] dark:border-[#272A30]'
            }`}
          >
            <span>{getCategoryName(cat)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Categories;
