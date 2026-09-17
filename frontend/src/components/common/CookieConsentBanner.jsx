import React, { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bol_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bol_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('bol_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#17181A] dark:text-[#F3F4F6] leading-tight">
              Cookie fayllaridan foydalanish
            </h4>
            <p className="text-[11px] sm:text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 leading-relaxed">
              Saytimiz sizga xavfsiz, qulay va tezkor xizmat ko‘rsatish hamda savat ma'lumotlarini saqlash uchun cookie fayllaridan foydalanadi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#17181A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#202328] transition-colors cursor-pointer"
          >
            Rad etish
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Qabul qilish</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
