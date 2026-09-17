import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Clock, Award, HeartHandshake, Truck } from 'lucide-react';
import Button from '../common/Button';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section id="home" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-[#16181D] border-b border-[#E5E7EB] dark:border-[#26282E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Subtitle & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Editorial Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-xs font-semibold border border-[#BFDBFE]/60 dark:border-[#1E3A8A] mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('hero.badge', 'Yangi mavsum aksiyalari')} • {t('brand.name', 'Bol Tortlari')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight leading-[1.15] mb-5">
              {t('hero.title_part1', 'Har bir bayramga')} <br className="hidden sm:inline" />
              <span className="text-[#2563EB]">{t('hero.title_highlight', 'o‘ziga xos tort')}</span>
            </h1>

            {/* Concise Description */}
            <p className="text-sm sm:text-base text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-xl mb-8">
              {t('hero.description', '100% tabiiy qaymoq, toza sariyog‘ va Belgiyacha shokoladdan tayyorlangan yangi shirinliklar. Aniq belgilangan vaqtda sovutgichli avtomobillarda xavfsiz yetkazib beramiz.')}
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-10">
              <Link to="/cakes" className="w-full sm:w-auto">
                <Button size="md" variant="primary" icon={ArrowRight} className="w-full sm:w-auto shadow-sm">
                  {t('hero.cta_catalog', 'Tortlarni ko‘rish')}
                </Button>
              </Link>

              <Link to="/custom-cake" className="w-full sm:w-auto">
                <Button size="md" variant="secondary" className="w-full sm:w-auto">
                  {t('hero.cta_custom', 'Maxsus tort yaratish')}
                </Button>
              </Link>
            </div>

            {/* 4 Trust Indicators Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#E5E7EB] dark:border-[#26282E] w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">{t('hero.trust_years', '10+ yil tajriba')}</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Usta qandolatchilar</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">{t('hero.trust_natural', 'Tabiiy mahsulotlar')}</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">82.5% toza sariyog‘</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">{t('hero.trust_delivery', 'Yetkazib berish')}</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Sovutgichli mashinada</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">{t('hero.trust_clients', 'Maxsus buyurtmalar')}</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Individual dizayn</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#26282E] shadow-card bg-[#F3F4F6] dark:bg-[#1C1F26] aspect-[4/3] sm:aspect-[5/4] group">
              <img
                src="/hero-cake.jpg"
                alt="Bol Tortlari Luks Tort"
                onError={handleImageError}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-white/95 dark:bg-[#16181D]/95 border border-[#E5E7EB] dark:border-[#26282E] backdrop-blur-md shadow-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#2563EB] tracking-wider block">Kolleksiya Yulduzi</span>
                  <span className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">Shohona To‘y & Marosim Torti</span>
                </div>
                <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] bg-[#F3F4F6] dark:bg-[#202328] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#26282E]">
                  ★ 4.95
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
