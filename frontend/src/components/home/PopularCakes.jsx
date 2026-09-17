import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Cake as CakeIcon } from 'lucide-react';
import { cakeApi } from '../../services/api';
import CakeCard from '../cake/CakeCard';
import Categories from './Categories';

const PopularCakes = () => {
  const { t } = useTranslation();
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);
        const res = await cakeApi.getAll();
        setCakes(res.data?.cakes || []);
      } catch (err) {
        console.error('Error fetching cakes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCakes();
  }, []);

  const filteredCakes =
    activeCategory === 'all'
      ? cakes.slice(0, 8)
      : cakes
          .filter(
            (cake) =>
              cake.category_slug === activeCategory ||
              cake.category === activeCategory
          )
          .slice(0, 8);

  return (
    <section id="cakes" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider block mb-1">
              {t('popular.badge', 'Kolleksiya')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              {t('popular.title', 'Eng Mashhur Tortlarimiz')}
            </h2>
          </div>

          <Link
            to="/cakes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            <span>{t('popular.view_all', 'Barcha tortlarni ko‘rish')} ({cakes.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories navigation filter */}
        <div className="mb-7">
          <Categories
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>

        {/* 4-Column Responsive Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCakes.length === 0 ? (
          <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-12 text-center shadow-subtle">
            <CakeIcon className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
              {t('catalog.no_cakes', 'Hozircha ushbu toifada tortlar mavjud emas.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredCakes.map((cake) => (
              <CakeCard key={cake._id || cake.id} cake={cake} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularCakes;
