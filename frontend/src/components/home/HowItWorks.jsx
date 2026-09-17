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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} hover className="relative flex flex-col items-start">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-[#17181A] dark:text-[#F3F4F6] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
