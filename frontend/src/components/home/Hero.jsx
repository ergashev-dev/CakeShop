import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  HeartHandshake,
  Truck,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import Button from '../common/Button';
import { handleImageError } from '../../utils/imageFallback';

const HERO_CAKES = [
  {
    id: 1,
    name: 'Shohona To‘y & Marosim Torti',
    tag: 'Kolleksiya Yulduzi',
    price: '350 000 so‘m',
    rating: '4.95',
    image: '/hero-cake.jpg',
    category: 'Premium Marosim',
  },
  {
    id: 2,
    name: 'Belgiya Shokoladli Trufel',
    tag: 'Eng Ko‘p Sotilgan',
    price: '240 000 so‘m',
    rating: '4.90',
    image: '/cakes/chocolate-truffle.jpg',
    category: 'Shokoladli',
  },
  {
    id: 3,
    name: 'Qizil Baxmal (Red Velvet)',
    tag: 'Mijozlar Sevimlisi',
    price: '220 000 so‘m',
    rating: '4.85',
    image: '/cakes/red-velvet.jpg',
    category: 'Klassik',
  },
  {
    id: 4,
    name: 'Klassik Nyu-York Cheesecake',
    tag: 'Tabiiy Pishloqli',
    price: '210 000 so‘m',
    rating: '4.92',
    image: '/cakes/cheesecake.jpg',
    category: 'Cheesecake',
  },
  {
    id: 5,
    name: 'Malinali Pistali Luks Tort',
    tag: 'Mavsum Yangiligi',
    price: '280 000 so‘m',
    rating: '4.96',
    image: '/cakes/pistachio-raspberry.jpg',
    category: 'Mevali & Yong‘oqli',
  },
];

const Hero = () => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 3.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_CAKES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeCake = HERO_CAKES[currentIdx];

  const handlePrev = (e) => {
    e.preventDefault();
    setCurrentIdx((prev) => (prev - 1 + HERO_CAKES.length) % HERO_CAKES.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setCurrentIdx((prev) => (prev + 1) % HERO_CAKES.length);
  };

  return (
    <section id="home" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-[#16181D] border-b border-[#E5E7EB] dark:border-[#26282E] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Subtitle & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Editorial Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-xs font-semibold border border-[#BFDBFE]/60 dark:border-[#1E3A8A] mb-5 animate-in fade-in duration-300">
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

          {/* Right Column: Hero Visual Showcase (Auto-Alternating with Smooth Animations) */}
          <div className="lg:col-span-5">
            <div
              className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#26282E] shadow-xl bg-[#F3F4F6] dark:bg-[#1C1F26] aspect-[4/3] sm:aspect-[5/4] group select-none"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Image with dynamic key transition */}
              <Link to="/cakes" className="block w-full h-full relative overflow-hidden">
                <img
                  key={activeCake.id}
                  src={activeCake.image}
                  alt={activeCake.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 animate-in fade-in zoom-in-95"
                  loading="eager"
                />
              </Link>

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                aria-label="Oldingi tort"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                aria-label="Keyingi tort"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Floating Information Glass Card */}
              <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-white/95 dark:bg-[#16181D]/95 border border-[#E5E7EB] dark:border-[#26282E] backdrop-blur-md shadow-lg flex items-center justify-between transition-all">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] uppercase font-extrabold text-[#2563EB] dark:text-[#60A5FA] tracking-wider block">
                      {activeCake.tag}
                    </span>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">•</span>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                      {activeCake.category}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-[#F3F4F6] truncate max-w-[210px] sm:max-w-[260px]">
                    {activeCake.name}
                  </h3>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/60 mb-1">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    {activeCake.rating}
                  </span>
                  <span className="text-xs font-black text-[#111827] dark:text-[#F3F4F6]">
                    {activeCake.price}
                  </span>
                </div>
              </div>

              {/* Slide Indicator Dots */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md z-10">
                {HERO_CAKES.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentIdx(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slayd ${i + 1}`}
                  />
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
