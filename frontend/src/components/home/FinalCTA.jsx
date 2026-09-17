import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const FinalCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-28 sm:py-40 bg-[#F7F5F0] dark:bg-[#121110] text-center overflow-hidden relative">
      {/* Ambient Warm Confectionery Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[350px] rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-600/10 blur-3xl animate-pulse-subtle" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative">
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
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1C1A] text-[#F7F5F0] dark:bg-[#F7F5F0] dark:text-[#1C1C1A] hover:bg-[#3A2921] dark:hover:bg-[#EFECE5] text-xs sm:text-sm font-medium tracking-editorial uppercase transition-all shadow-subtle hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <span>Buyurtma berish</span>
            <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
          </Link>

          <a
            href="tel:+998901234567"
            className="text-xs sm:text-sm font-medium tracking-editorial uppercase text-[#1C1C1A] dark:text-[#F7F5F0] hover:text-[#77746D] dark:hover:text-[#C9B9A5] transition-all underline-offset-8 hover:underline hover:-translate-y-0.5"
          >
            +998 (90) 123-45-67
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
