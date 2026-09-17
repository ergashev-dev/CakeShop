import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Truck, Award, Sparkles } from 'lucide-react';
import Card from '../common/Card';

const WhyUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800',
      title: t('why_us.item1_title', '100% Tabiiy va Halol'),
      desc: t('why_us.item1_desc', 'Faqat 82.5% li toza sariyog‘, haqiqiy Belgiya shokoladi, yangi mevalar va tabiiy tog‘ asali. Sun’iy kimyoviy qo‘shimchalar mutlaqo yo‘q.'),
    },
    {
      icon: Truck,
      iconColor: 'text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border border-[#BFDBFE]/60 dark:border-[#1E3A8A]',
      title: t('why_us.item2_title', 'Sovutgichli Xavfsiz Yetkazish'),
      desc: t('why_us.item2_desc', 'Tortlar maxsus harorat nazorati va fiksatsiyaga ega avtomobillarda yetkaziladi. Qayerda bo‘lsangiz ham ideal holatda boradi.'),
    },
    {
      icon: Award,
      iconColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',
      title: t('why_us.item3_title', '10+ Yillik Qandolatchilik San’ati'),
      desc: t('why_us.item3_desc', '15 000 dan ortiq to‘y, yubiley va tug‘ilgan kunlarni unutilmas qilgan professional ustalar tomonidan yangi pishiriladi.'),
    },
  ];

  return (
    <section id="story" className="py-12 sm:py-16 bg-white dark:bg-[#16181D] border-y border-[#E5E7EB] dark:border-[#26282E]">
      <div id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider block mb-1">
            {t('why_us.badge', 'Afzalliklarimiz')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
            {t('why_us.title', 'Nima uchun Bol Tortlarini tanlashadi?')}
          </h2>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
            {t('why_us.subtitle', 'Har bir buyurtma — bu sizning ishonchingiz va bizning mehrimiz bilan tayyorlangan bayramona shirinlik.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#FBFBFC] dark:bg-[#1C1F26] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${item.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#111827] dark:text-[#F3F4F6] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
