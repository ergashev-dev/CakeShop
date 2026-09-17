import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layers, Palette, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../common/Button';

const CustomCakeCTA = () => {
  const { t } = useTranslation();

  const options = [
    { icon: Layers, label: '1–3 Qavatli dizayn', desc: 'Har qanday o‘lcham' },
    { icon: Palette, label: '12 xil mualliflik kremi', desc: 'Belgiya ganashi & mevalar' },
    { icon: Calendar, label: 'Aniq belgilangan vaqt', desc: 'Daqiqasigacha yetkazish' },
  ];

  return (
    <section id="custom-cake" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl p-6 sm:p-10 lg:p-12 shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('custom_cta.badge', 'Individual buyurtma')}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-[#17181A] dark:text-[#F3F4F6] tracking-tight mb-4">
                {t('custom_cta.title_part1', 'O‘zingiz tasavvur qiling.')} <span className="text-[#2563EB]">{t('custom_cta.title_highlight', 'Biz tayyorlaymiz.')}</span>
              </h2>

              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-xl mb-6">
                {t('custom_cta.desc', 'To‘y, tug‘ilgan kun yoki korporativ tadbirlar uchun o‘ziga xos dizayn va hajmda buyurtma bering. Qandolatchilarimiz sizning g‘oyangizni san’at asariga aylantiradi.')}
              </p>

              {/* 3 Benefit Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {options.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]"
                    >
                      <Icon className="w-4 h-4 text-[#2563EB] mb-1.5" />
                      <div className="text-xs font-semibold text-[#17181A] dark:text-[#F3F4F6]">{opt.label}</div>
                      <div className="text-[11px] text-[#6B7280]">{opt.desc}</div>
                    </div>
                  );
                })}
              </div>

              <Link to="/custom-cake">
                <Button size="md" variant="primary" icon={ArrowRight}>
                  {t('custom_cta.button', 'Konstruktorda yasash')}
                </Button>
              </Link>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-[#E7E9ED] dark:border-[#272A30] shadow-sm bg-[#F7F8FA] dark:bg-[#1F2227] p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E7E9ED] dark:border-[#2E3138]">
                  <span className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">Individual Buyurtma Namunasi</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">Jonli</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E7E9ED]/60 dark:border-[#2E3138]/60">
                    <span className="text-[#6B7280]">Hajmi & Qavat:</span>
                    <span className="font-semibold text-[#17181A] dark:text-[#F3F4F6]">2 qavatli (2.5 kg)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E7E9ED]/60 dark:border-[#2E3138]/60">
                    <span className="text-[#6B7280]">Korj & Krem:</span>
                    <span className="font-semibold text-[#17181A] dark:text-[#F3F4F6]">Asalli + Qulupnay konfi</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E7E9ED]/60 dark:border-[#2E3138]/60">
                    <span className="text-[#6B7280]">Bezak & Tabrik:</span>
                    <span className="font-semibold text-[#2563EB]">"Tug‘ilgan kuning bilan!"</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span className="text-[#17181A] dark:text-[#F3F4F6]">Taxminiy narx:</span>
                    <span className="text-[#2563EB]">380 000 so‘m</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomCakeCTA;
