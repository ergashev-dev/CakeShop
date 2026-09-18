import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Camera,
  Mic,
  Bell,
  X,
  AlertCircle,
  Settings,
} from 'lucide-react';
import Button from '../common/Button';

export const PermissionModal = ({
  isOpen,
  onClose,
  type = 'location', // 'location' | 'camera' | 'microphone' | 'notification'
  isDenied = false,
  isNotFound = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let Icon = MapPin;
  let title = '';
  let desc = '';
  let confirmLabel = '';
  let cancelLabel = t('ux.permissions.location.btn_later', 'Keyinroq');

  if (type === 'location') {
    Icon = MapPin;
    if (isDenied) {
      title = t('ux.permissions.location.denied_title', 'Joylashuvga ruxsat berilmagan');
      desc = t('ux.permissions.location.denied_desc', 'Qurilmangiz yoki brauzeringiz sozlamalaridan Location ruxsatini yoqing.');
    } else if (isNotFound) {
      title = t('ux.permissions.location.not_found_title', 'Joylashuvni aniqlab bo‘lmadi');
      desc = t('ux.permissions.location.not_found_desc', 'Joylashuvingizni tekshirib, qayta urinib ko‘ring.');
    } else {
      title = t('ux.permissions.location.title', 'Joylashuvingizdan foydalanamiz');
      desc = t('ux.permissions.location.desc', 'Yaqin atrofdagi xizmatlarni topish yoki yetkazib berish manzilingizni aniqlash uchun joylashuvga ruxsat kerak.');
      confirmLabel = t('ux.permissions.location.btn_grant', 'Joylashuvni yoqish');
    }
  } else if (type === 'camera') {
    Icon = Camera;
    cancelLabel = t('ux.permissions.camera.btn_cancel', 'Bekor qilish');
    if (isDenied) {
      title = t('ux.permissions.camera.denied_title', 'Kameraga ruxsat berilmagan');
      desc = t('ux.permissions.camera.denied_desc', 'Brauzer sozlamalaridan kameraga ruxsat bering.');
    } else {
      title = t('ux.permissions.camera.title', 'Kameraga ruxsat kerak');
      desc = t('ux.permissions.camera.desc', 'QR kod skanerlash yoki rasm olish uchun kameradan foydalanishga ruxsat bering.');
      confirmLabel = t('ux.permissions.camera.btn_grant', 'Ruxsat berish');
    }
  } else if (type === 'microphone') {
    Icon = Mic;
    cancelLabel = t('ux.permissions.microphone.btn_cancel', 'Bekor qilish');
    if (isDenied) {
      title = t('ux.permissions.microphone.denied_title', 'Mikrofonga ruxsat berilmagan');
      desc = t('ux.permissions.microphone.denied_desc', 'Ovozli qidiruvdan foydalanish uchun brauzer sozlamalaridan mikrofonga ruxsat bering.');
    } else {
      title = t('ux.permissions.microphone.title', 'Mikrofon kerak');
      desc = t('ux.permissions.microphone.desc', 'Ovozli qidiruvdan foydalanish uchun mikrofonga ruxsat bering.');
      confirmLabel = t('ux.permissions.microphone.btn_grant', 'Mikrofonga ruxsat berish');
    }
  } else if (type === 'notification') {
    Icon = Bell;
    title = t('ux.permissions.notification.title', 'Bildirishnomalarni yoqish');
    desc = t('ux.permissions.notification.desc', 'Buyurtma holati, yangiliklar va muhim xabarlar haqida bildirishnoma olishni xohlaysizmi?');
    confirmLabel = t('ux.permissions.notification.btn_grant', 'Yoqish');
    cancelLabel = t('ux.permissions.notification.btn_later', 'Keyinroq');
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#16181D] border border-stone-200 dark:border-[#26282E] rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Apple-style minimalist icon badge */}
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${
          isDenied
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50'
            : 'bg-stone-100 dark:bg-[#1A1D24] text-[#2563EB] dark:text-[#60A5FA] border border-stone-200/70 dark:border-stone-800'
        }`}>
          {isDenied ? (
            <AlertCircle className="w-6 h-6 stroke-[1.75]" />
          ) : (
            <Icon className="w-6 h-6 stroke-[1.75]" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-base font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel || onClose}
            className="flex-1"
          >
            {cancelLabel}
          </Button>

          {!isDenied && confirmLabel && (
            <Button
              variant="primary"
              size="sm"
              onClick={onConfirm}
              className="flex-1 shadow-xs"
            >
              {confirmLabel}
            </Button>
          )}

          {isDenied && (
            <Button
              variant="primary"
              size="sm"
              icon={Settings}
              onClick={onClose}
              className="flex-1 shadow-xs"
            >
              Tushundim
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PermissionModal;
