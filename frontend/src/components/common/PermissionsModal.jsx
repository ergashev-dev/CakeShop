import React, { useState, useEffect } from 'react';
import { Bell, Camera, MapPin, Sparkles, Check, X, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const PermissionsModal = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or granted permissions
    const isDismissed = localStorage.getItem('bol_permissions_dismissed');
    if (isDismissed) return;

    // Check existing notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
      setHasNotification(true);
    }

    // Delay modal slightly so user first sees the page loaded
    const timer = setTimeout(() => {
      // If notification is not granted yet, show prompt
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        setIsOpen(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleGrantAll = async () => {
    let notifGranted = false;
    let locGranted = false;

    // 1. Request Notification Permission
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          notifGranted = true;
          setHasNotification(true);
        }
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }

    // 2. Request Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          locGranted = true;
          setHasLocation(true);
        },
        () => {},
        { timeout: 5000 }
      );
    }

    localStorage.setItem('bol_permissions_dismissed', 'true');
    localStorage.setItem('bol_permissions_granted', 'true');
    setIsOpen(false);

    toast.success(
      'Qulayliklar faollashtirildi!',
      'Endi buyurtma yangiliklari va yetkazib berish sizga qulay tarzda yetkaziladi.'
    );
  };

  const handleDismiss = () => {
    localStorage.setItem('bol_permissions_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Xizmat Qulayliklarini Yoqish
              </h3>
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                Saytdan to‘laqonli foydalanish uchun kerakli ruxsatlar
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#17181A] dark:hover:text-white cursor-pointer"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 pt-1">
          {/* Notifications */}
          <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2228] border border-[#E7E9ED]/70 dark:border-[#2E323A] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Buyurtma xabarnomalari
              </div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight">
                Buyurtmangiz qabul qilingani va kuryer yetkazayotganini darhol bilish
              </div>
            </div>
            {hasNotification && <Check className="w-4 h-4 text-emerald-500" />}
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2228] border border-[#E7E9ED]/70 dark:border-[#2E323A] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Aniq joylashuv (Geolokatsiya)
              </div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight">
                Yetkazib berish manzilini bitta bosishda xaritadan avtomatik aniqlash
              </div>
            </div>
            {hasLocation && <Check className="w-4 h-4 text-emerald-500" />}
          </div>

          {/* Camera / Photos */}
          <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#1F2228] border border-[#E7E9ED]/70 dark:border-[#2E323A] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Kamera va rasm yuklash
              </div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight">
                Tort yetib kelgach rasmga olib sharh qoldirish va o‘z dizayningizni yuklash
              </div>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] justify-center pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ma’lumotlaringiz xavfsiz va faqat buyurtma xizmati uchun ishlatiladi</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#E7E9ED] dark:border-[#2E323A] text-xs font-semibold text-[#6B7280] hover:text-[#17181A] dark:hover:text-white transition-colors cursor-pointer"
          >
            Keyinroq
          </button>
          <button
            onClick={handleGrantAll}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-subtle flex items-center justify-center gap-1.5 cursor-pointer btn-press"
          >
            <Check className="w-4 h-4" />
            <span>Ruxsatlarni yoqish</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
