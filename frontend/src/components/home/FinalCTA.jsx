import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-28 sm:py-40 bg-[#F7F5F0] dark:bg-[#121110] text-center overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12">
        <span className="block text-[11px] tracking-widest uppercase text-[#77746D] dark:text-[#C9B9A5] mb-6">
          10 — Buyurtma
        </span>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light text-[#1C1C1A] dark:text-[#F7F5F0] leading-[1.15] mb-6">
          Bugungi bayramingizni <br />
          <span className="italic font-normal">yanada shirin qiling.</span>
        </h2>

        <p className="text-sm sm:text-base text-[#77746D] dark:text-[#949087] font-light max-w-xl mx-auto leading-relaxed mb-10">
          Bol Tortlari bilan har qanday uchrashuv, bayram va tantana unutilmas xotiraga aylanadi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          <Link
            to="/cakes"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1C1C1A] text-[#F7F5F0] dark:bg-[#F7F5F0] dark:text-[#1C1C1A] hover:bg-[#3A2921] dark:hover:bg-[#EFECE5] text-xs sm:text-sm font-medium tracking-editorial uppercase transition-colors"
          >
            <span>Buyurtma berish</span>
            <span>→</span>
          </Link>

          <a
            href="tel:+998901234567"
            className="text-xs sm:text-sm font-medium tracking-editorial uppercase text-[#1C1C1A] dark:text-[#F7F5F0] hover:text-[#77746D] dark:hover:text-[#C9B9A5] transition-colors underline-offset-8 hover:underline"
          >
            +998 (90) 123-45-67
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
