import React from 'react';

const BrandStatement = () => {
  return (
    <section className="py-24 sm:py-36 border-y border-[#C9B9A5]/30 dark:border-[#2C2A26]/80 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 text-center">
        <span className="block text-[10px] sm:text-xs tracking-widest uppercase text-[#77746D] dark:text-[#C9B9A5] mb-6">
          Bizning Falsafamiz
        </span>

        <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#1C1C1A] dark:text-[#F7F5F0] leading-[1.25] tracking-tight">
          «10 yildan ortiq vaqt davomida har bir tortni shunchaki shirinlik emas,{' '}
          <span className="italic font-normal">alohida bayramona hikoya</span> sifatida yaratamiz.»
        </h2>

        <p className="mt-8 text-xs sm:text-sm text-[#77746D] dark:text-[#949087] tracking-editorial uppercase max-w-md mx-auto">
          Tabiiy qaymoq • Belgiya shokoladi • Toza tog‘ asali
        </p>
      </div>
    </section>
  );
};

export default BrandStatement;
