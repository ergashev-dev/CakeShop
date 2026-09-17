import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, CalendarClock, Truck } from 'lucide-react';
import Card from '../common/Card';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      num: '1',
      icon: ShoppingBag,
      title: t('how_it_works.step1_title', '1. Tortni tanlang'),
      desc: t('how_it_works.step1_desc', 'Mavsumiy katalogimizdan yoki o‘zingiz xohlagan individual dizayndagi tortni savatga qo‘shing.'),
    },
    {
      num: '2',
      icon: CalendarClock,
      title: t('how_it_works.step2_title', '2. Vaqt va manzilni ko‘rsating'),
      desc: t('how_it_works.step2_desc', 'Yetkazib berish sanasi, aniq soati va manzilni belgilang. Qandolatchilarimiz yangi pishirishadi.'),
    },
    {
      num: '3',
      icon: Truck,
      title: t('how_it_works.step3_title', '3. Qabul qilib oling'),
      desc: t('how_it_works.step3_desc', 'Maxsus sovutgichli avtomobilimiz tortni belgilangan vaqtda bezaklariga ziyon yetkazmasdan yetkazadi.'),
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-[#16181D] border-y border-[#E7E9ED] dark:border-[#272A30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider block mb-1">
            {t('how_it_works.badge', 'Qanday ishlaydi?')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17181A] dark:text-[#F3F4F6]">
            {t('how_it_works.title', 'Buyurtma berishning 3 ta oson qadami')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-subtle hover:shadow-card card-interactive hover:border-blue-500/30 dark:hover:border-blue-400/20 group flex flex-col items-start transition-all duration-300"
              >
                {/* Step Number Top Badge */}
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138] text-[11px] font-black text-[#6B7280] dark:text-[#9CA3AF] flex items-center justify-center group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] group-hover:border-blue-400/40 transition-colors">
                  0{step.num}
                </div>

                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 shadow-xs border border-blue-100 dark:border-blue-900/50">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#17181A] dark:text-[#F3F4F6] mb-2 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
