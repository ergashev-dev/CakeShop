import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Apple,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const InstallAppModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [isInstallable, setIsInstallable] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect device automatically
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      setActiveTab('ios');
    } else if (/android/i.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    if (window.deferredPwaPrompt) {
      setIsInstallable(true);
    }

    const handlePwaReady = () => setIsInstallable(true);
    window.addEventListener('pwa-ready-to-install', handlePwaReady);
    return () => window.removeEventListener('pwa-ready-to-install', handlePwaReady);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (window.deferredPwaPrompt) {
      window.deferredPwaPrompt.prompt();
      const choiceResult = await window.deferredPwaPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        window.deferredPwaPrompt = null;
        setIsInstallable(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#16181D] border border-amber-200/70 dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Confectionery Glow Background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-400/20 dark:bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-blue-500/15 dark:bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-stone-100 dark:hover:bg-[#202328] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1F26] border border-amber-200 dark:border-amber-500/30 p-2 shadow-subtle flex items-center justify-center shrink-0">
            <img src="/cake-logo.svg" alt="Bol Tortlari" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3" /> Rasmiy Dastur
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#111827] dark:text-[#F3F4F6]">
              Bol Tortlari Ilovasini O‘rnatish
            </h3>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-[#1F2228] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-[#2A2E37] text-[#2563EB] dark:text-white shadow-xs'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-[#2A2E37] text-[#2563EB] dark:text-white shadow-xs'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iOS / Apple</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-[#2A2E37] text-[#2563EB] dark:text-white shadow-xs'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Tab 1: Android */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {installSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  Ilova muvaffaqiyatli o‘rnatildi!
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Endi telefoningiz asosiy ekranidan to‘g‘ridan-to‘g‘ri kirishingiz mumkin.
                </p>
              </div>
            ) : (
              <>
                {isInstallable && (
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-[#2563EB] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ilovani 1 Bosishda O‘rnatish</span>
                  </button>
                )}

                <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#1F2228] border border-[#E7E9ED] dark:border-[#2E3138] space-y-3">
                  <h4 className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] uppercase tracking-wider">
                    Qo‘lda o‘rnatish qo‘llanmasi:
                  </h4>
                  <div className="flex items-start gap-3 text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] font-black flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>Brauzeringizning (Chrome / Samsung Internet) yuqori o‘ng burchagidagi uch nuqta <strong>(⋮)</strong> tugmasini bosing.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] font-black flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>Menyudan <strong>"Ilovani o‘rnatish"</strong> yoki <strong>"Bosh ekranga qo‘shish"</strong> (Add to Home screen) bandini tanlang.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: iOS (iPhone / iPad) */}
        {activeTab === 'ios' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Apple className="w-4 h-4" /> Safari brauzerida 2 qadam:
              </h4>

              <div className="flex items-start gap-3 text-xs text-[#374151] dark:text-[#D1D5DB]">
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#16181D] border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-[#2563EB] shrink-0 shadow-xs">
                  <Share className="w-4 h-4" />
                </div>
                <div className="pt-1">
                  <strong>1-qadam:</strong> Safari pastki panelidagi <strong>"Ulashish" (Share)</strong> tugmasini bosing.
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-[#374151] dark:text-[#D1D5DB]">
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#16181D] border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-[#2563EB] shrink-0 shadow-xs">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="pt-1">
                  <strong>2-qadam:</strong> Chiqqan menyuni pastga surib, <strong>"Bosh ekranga qo‘shish" (Add to Home Screen)</strong> bandini tanlang va "Qo‘shish"ni bosing.
                </div>
              </div>
            </div>

            <p className="text-[11px] text-center text-[#6B7280] dark:text-[#9CA3AF]">
              Shundan so‘ng "Bol Tortlari" belgisi iPhone ish stolida mustaqil dastur sifatida paydo bo‘ladi!
            </p>
          </div>
        )}

        {/* Tab 3: Desktop */}
        {activeTab === 'desktop' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {installSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  Kompyuteringizga o‘rnatildi!
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Dastur ish stolingizda va Start menyusida paydo bo‘ldi.
                </p>
              </div>
            ) : (
              <>
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 hover:from-blue-600 hover:to-[#2563EB] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Kompyuterga O‘rnatish</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] dark:bg-[#1F2228] border border-[#E7E9ED] dark:border-[#2E3138] space-y-3">
                    <h4 className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] uppercase tracking-wider">
                      Chrome yoki Edge brauzerida:
                    </h4>
                    <div className="flex items-start gap-3 text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] font-black flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <span>Brauzerning manzil qatori (URL) o‘ng tomonidagi kichik kompyutercha yoki <strong>(+)</strong> belgisini bosing.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-[#4B5563] dark:text-[#D1D5DB]">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] font-black flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <span><strong>"O‘rnatish" (Install)</strong> tugmasini bosing va ilovadan to‘liq alohida oynada foydalaning.</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Benefits Strip */}
        <div className="grid grid-cols-3 gap-2 pt-5 mt-5 border-t border-[#E5E7EB] dark:border-[#26282E] text-center">
          <div className="space-y-1">
            <Zap className="w-4 h-4 text-amber-500 mx-auto" />
            <div className="text-[11px] font-bold text-[#111827] dark:text-[#F3F4F6]">1 soniyada ochiladi</div>
            <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Tezkor yuklanish</div>
          </div>
          <div className="space-y-1">
            <Sparkles className="w-4 h-4 text-[#2563EB] mx-auto" />
            <div className="text-[11px] font-bold text-[#111827] dark:text-[#F3F4F6]">3D Studiya</div>
            <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Doim qo‘l ostida</div>
          </div>
          <div className="space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
            <div className="text-[11px] font-bold text-[#111827] dark:text-[#F3F4F6]">Xavfsiz & Rasmiy</div>
            <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">0 MB ortiqcha joy</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstallAppModal;
