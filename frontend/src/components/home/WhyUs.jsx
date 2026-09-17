import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Truck, Award, Sparkles, CheckCircle2 } from 'lucide-react';

const WhyUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ShieldCheck,
      badgeText: '100% Halol & Sof',
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60',
      title: t('why_us.item1_title', '100% Tabiiy va Halol'),
      desc: t('why_us.item1_desc', 'Faqat 82.5% li toza sariyog‘, haqiqiy Belgiya shokoladi, yangi mevalar va tabiiy tog‘ asali. Sun’iy kimyoviy qo‘shimchalar mutlaqo yo‘q.'),
    },
    {
      icon: Truck,
      badgeText: 'Sovutgichli Avto',
      iconColor: 'text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 border border-[#BFDBFE]/80 dark:border-[#1E3A8A]/80',
      title: t('why_us.item2_title', 'Sovutgichli Xavfsiz Yetkazish'),
      desc: t('why_us.item2_desc', 'Tortlar maxsus harorat nazorati va fiksatsiyaga ega avtomobillarda yetkaziladi. Qayerda bo‘lsangiz ham ideal holatda boradi.'),
    },
    {
      icon: Award,
      badgeText: '10+ Yil Tajriba',
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60',
      title: t('why_us.item3_title', '10+ Yillik Qandolatchilik San’ati'),
      desc: t('why_us.item3_desc', '15 000 dan ortiq to‘y, yubiley va tug‘ilgan kunlarni unutilmas qilgan professional ustalar tomonidan yangi pishiriladi.'),
    },
  ];

  return (
    <section id="story" className="py-14 sm:py-20 relative overflow-hidden border-y border-stone-200/70 dark:border-stone-800/80 bg-gradient-to-b from-stone-50/80 via-amber-50/20 to-stone-50/80 dark:from-[#0E1015] dark:via-[#13161F] dark:to-[#0E1015]">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header with Spinning 360° Quality Seal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse-subtle" />
              <span>{t('why_us.badge', 'Afzalliklarimiz')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
              {t('why_us.title', 'Nima uchun Bol Tortlarini tanlashadi?')}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-2 leading-relaxed">
              {t('why_us.subtitle', 'Har bir buyurtma — bu sizning ishonchingiz va bizning mehrimiz bilan tayyorlangan bayramona shirinlik.')}
            </p>
          </div>

          {/* Interactive Rotating 360° Stamp */}
          <div className="hidden sm:flex items-center shrink-0">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Rotating SVG circular text path */}
              <svg className="w-full h-full animate-spin-slow select-none" viewBox="0 0 100 100">
                <path
                  id="circlePath"
                  d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                  fill="none"
                />
                <text className="text-[7.2px] font-extrabold tracking-[2.4px] fill-[#2563EB] dark:fill-[#60A5FA] uppercase">
                  <textPath href="#circlePath" startOffset="0%">
                    ★ BOL TORTLARI ★ 100% SIFAT KAFOLATI
                  </textPath>
                </text>
              </svg>
              {/* Glowing Center Badge */}
              <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg text-white">
                <Sparkles className="w-6 h-6 animate-pulse-subtle drop-shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards with Glassmorphism & Hover Lift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group bg-white/80 dark:bg-[#16181D]/80 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/90 hover:border-amber-400/50 dark:hover:border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl card-hover-lift transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Subtle card top gradient shine */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xs ${item.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800/80 text-[11px] font-bold text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
                      {item.badgeText}
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-[#111827] dark:text-[#F3F4F6] mb-2.5 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/60 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kafolatlangan standart</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
