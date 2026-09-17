import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Truck, Clock, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const DeliverySection = () => {
  const { t } = useTranslation();

  return (
    <section id="delivery" className="py-12 sm:py-16 bg-white dark:bg-[#16181D] border-t border-[#E7E9ED] dark:border-[#272A30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold mb-3">
              <Truck className="w-3.5 h-3.5" />
              <span>{t('delivery_section.badge', 'Yetkazib berish')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#17181A] dark:text-[#F3F4F6] mb-4">
              {t('delivery_section.title', 'Farg‘ona vodiysi bo‘ylab xavfsiz yetkazamiz')}
            </h2>

            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed mb-6">
              {t('delivery_section.desc', 'Tortlar juda nozik bo‘lgani sababli, biz ularni maxsus sovutgich va fiksatsiya vositalari bilan jihozlangan avtomobillarda yetkazamiz.')}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <a href="tel:+998901234567">
                <Button variant="primary" size="md" icon={Phone} iconPosition="left">
                  +998 (90) 123-45-67
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                <Clock className="w-4 h-4 text-[#2563EB] mb-1" />
                <div className="font-semibold text-[#17181A] dark:text-[#F3F4F6]">
                  {t('delivery_section.hours_title', '08:00 – 22:00')}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {t('delivery_section.hours_desc', 'Dam olishsiz har kuni')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="font-semibold text-[#17181A] dark:text-[#F3F4F6]">
                  {t('delivery_section.guarantee_title', '100% Butunlik')}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {t('delivery_section.guarantee_desc', 'Xavfsiz topshirish kafolati')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Service Quality Features */}
          <div className="lg:col-span-6">
            <Card padding="p-6" className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E7E9ED] dark:border-[#2E3138]">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#17181A] dark:text-[#F3F4F6]">
                    {t('delivery_section.features_card_title', 'Xavfsiz va tezkor yetkazib berish')}
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('delivery_section.features_card_desc', 'Buyurtmangiz sifatli va o‘z vaqtida manzilingizga yetib boradi')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                  <div className="font-semibold text-xs text-[#17181A] dark:text-[#F3F4F6] mb-1">
                    {t('delivery_section.thermo_title', '❄️ Termo-sovutgichli avto')}
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    {t('delivery_section.thermo_desc', 'Krem va shakllar erimasligi uchun optimal harorat nazorati.')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                  <div className="font-semibold text-xs text-[#17181A] dark:text-[#F3F4F6] mb-1">
                    {t('delivery_section.time_title', '⏱️ Aniq vaqtga yetkazish')}
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    {t('delivery_section.time_desc', 'Tadbir yoki marosimingiz boshlanish vaqtiga moslab yetkazamiz.')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                  <div className="font-semibold text-xs text-[#17181A] dark:text-[#F3F4F6] mb-1">
                    {t('delivery_section.box_title', '📦 Maxsus xavfsiz quti')}
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    {t('delivery_section.box_desc', 'Tebranishga chidamli qattiq qadoqlash usuli qo‘llaniladi.')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138]">
                  <div className="font-semibold text-xs text-[#17181A] dark:text-[#F3F4F6] mb-1">
                    {t('delivery_section.respect_title', '🤝 Ehtirom bilan topshirish')}
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    {t('delivery_section.respect_desc', 'Xushmuomala kuryerlar bayram kayfiyatingizni ko‘taradi.')}
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DeliverySection;
