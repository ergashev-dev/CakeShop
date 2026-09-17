import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Laptop,
  Apple,
  Download,
  Sparkles,
  Zap,
  Bell,
  Layers,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Button from '../common/Button';
import InstallAppModal from '../common/InstallAppModal';

const AppInstallSection = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [userDevice, setUserDevice] = useState('desktop'); // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      setUserDevice('ios');
    } else if (/android/i.test(ua)) {
      setUserDevice('android');
    } else {
      setUserDevice('desktop');
    }

    if (window.deferredPwaPrompt) {
      setIsInstallable(true);
    }

    const handlePwaReady = () => setIsInstallable(true);
    window.addEventListener('pwa-ready-to-install', handlePwaReady);
    return () => window.removeEventListener('pwa-ready-to-install', handlePwaReady);
  }, []);

  const handleInstallClick = async () => {
    if (window.deferredPwaPrompt) {
      window.deferredPwaPrompt.prompt();
      const choiceResult = await window.deferredPwaPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        window.deferredPwaPrompt = null;
        setIsInstallable(false);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <section id="app" className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-amber-500/15 via-blue-500/15 to-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-amber-50/40 dark:from-[#16181D] dark:via-[#1A1D24] dark:to-[#13151A] border border-amber-200/60 dark:border-[#26282E] rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden">
          
          {/* Top Decorative Sparkle */}
          <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-50 dark:opacity-25">
            <Sparkles className="w-28 h-28 text-amber-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-xs animate-pulse-subtle">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android • iOS • Desktop Ilovasi</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] dark:text-[#F3F4F6] tracking-tight leading-[1.2]">
                Bol Tortlari ilovasi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-blue-600 to-amber-600">
                  har doim qo‘l ostingizda
                </span>
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed max-w-xl">
                Ilovani qurilmangizga o‘rnating! Internet sekin bo‘lgan vaziyatda ham tortlar katalogini ko‘ring, 3D studiyada o‘z tortingizni yarating va 1 soniyada buyurtma bering.
              </p>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1F2228]/80 border border-stone-200/60 dark:border-stone-700/50 backdrop-blur-md shadow-xs card-interactive">
                  <Zap className="w-5 h-5 text-amber-500 mb-2" />
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">3x Tezkor Ochilish</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">To‘g‘ridan-to‘g‘ri bosh ekrandan</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1F2228]/80 border border-stone-200/60 dark:border-stone-700/50 backdrop-blur-md shadow-xs card-interactive">
                  <Bell className="w-5 h-5 text-[#2563EB] mb-2" />
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">Tezkor Xabarlar</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Aksiyalar va buyurtma holati</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#1F2228]/80 border border-stone-200/60 dark:border-stone-700/50 backdrop-blur-md shadow-xs card-interactive">
                  <Layers className="w-5 h-5 text-emerald-600 mb-2" />
                  <div className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">0 MB Joy</div>
                  <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Xotirani band qilmaydi</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-[#2563EB] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer active:scale-95 transition-all hover:scale-103"
                >
                  <Download className="w-4 h-4" />
                  <span>Ilovani O‘rnatish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-3.5 rounded-xl bg-white dark:bg-[#1F2228] border border-[#D1D5DB] dark:border-[#374151] hover:bg-stone-50 dark:hover:bg-[#252830] text-[#111827] dark:text-[#F3F4F6] font-semibold text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>Qo‘llanmani ko‘rish</span>
                  <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>

              {/* Supported Platforms Strip */}
              <div className="flex items-center gap-4 pt-3 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Mos platformalar:</span>
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Android
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Apple className="w-3.5 h-3.5 text-stone-800 dark:text-stone-200" /> iOS (iPhone/iPad)
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-[#2563EB]" /> Windows & Mac
                </span>
              </div>

            </div>

            {/* Right Mockup Showcase (5 cols) */}
            <div className="lg:col-span-5 flex justify-center relative">
              
              {/* Outer Phone Mockup Frame */}
              <div className="relative w-full max-w-[320px] aspect-[9/18] bg-stone-900 rounded-[44px] p-3 shadow-2xl border-4 border-stone-800/80 shadow-amber-500/10">
                
                {/* Phone Speaker Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-stone-800 rounded-full z-30" />

                {/* Inner Screen */}
                <div className="relative w-full h-full bg-[#FAF8F5] dark:bg-[#121418] rounded-[36px] overflow-hidden flex flex-col pt-8 pb-4 px-4 border border-stone-700/40">
                  
                  {/* Mock App Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <img src="/cake-logo.svg" alt="App" className="w-7 h-7" />
                      <span className="font-extrabold text-xs text-[#111827] dark:text-[#F3F4F6]">
                        Bol Tortlari
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800/50">
                      O‘rnatilgan
                    </span>
                  </div>

                  {/* Mock Cake Showcase Banner */}
                  <div className="my-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-blue-500/15 to-rose-500/20 p-3 border border-amber-200/50 dark:border-amber-700/30 text-center">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-stone-800 shadow-md mx-auto mb-2 flex items-center justify-center animate-float-slow">
                      <img src="/cake-logo.svg" alt="Cake" className="w-11 h-11 object-contain" />
                    </div>
                    <div className="text-[11px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                      3D Tort Konstruktori
                    </div>
                    <div className="text-[9px] text-[#6B7280] dark:text-[#9CA3AF]">
                      O‘z tortingizni jonli yarating
                    </div>
                  </div>

                  {/* Mock Quick Cards */}
                  <div className="space-y-2 mt-auto">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1A1D24] border border-stone-200/70 dark:border-stone-800 flex items-center justify-between shadow-xs">
                      <span className="text-[10px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                        🎂 To‘y & Bayram tortlari
                      </span>
                      <span className="text-[10px] text-[#2563EB] font-bold">Ko‘rish →</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1A1D24] border border-stone-200/70 dark:border-stone-800 flex items-center justify-between shadow-xs">
                      <span className="text-[10px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                        🚚 Sovutgichli yetkazish
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">08:00–22:00</span>
                    </div>
                  </div>

                  {/* Bottom Navigation Mock */}
                  <div className="pt-3 mt-2 border-t border-stone-200 dark:border-stone-800 flex justify-around text-[9px] text-[#6B7280]">
                    <span className="font-bold text-[#2563EB]">Bosh sahifa</span>
                    <span>Katalog</span>
                    <span>3D Studiya</span>
                    <span>Savat</span>
                  </div>

                </div>

                {/* Floating Badge on Mockup */}
                <div className="absolute -bottom-4 -left-4 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-[#1A1D24]/95 border border-amber-300/80 dark:border-amber-500/40 shadow-xl backdrop-blur-md flex items-center gap-2 animate-float-slow select-none">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                    Bosh ekranga qo‘shildi
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Interactive Modal */}
      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default AppInstallSection;
