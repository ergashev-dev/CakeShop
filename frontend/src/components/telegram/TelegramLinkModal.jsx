import React, { useState, useEffect } from 'react';
import { X, Send, Check, Copy, ExternalLink, ShieldCheck, Sparkles, Unlink } from 'lucide-react';
import { userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import socketClient from '../../services/socket';

const TelegramLinkModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [justLinked, setJustLinked] = useState(false);

  // Fetch token when opened and not linked
  useEffect(() => {
    if (isOpen && user && !user.telegramId) {
      setLoading(true);
      userApi
        .getTelegramLinkToken()
        .then((res) => {
          setLinkData(res.data);
        })
        .catch((err) => {
          console.error('Failed to get telegram token:', err);
          toast.error('Telegram havolasini olishda xatolik yuz berdi.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, user, toast]);

  // Real-time listener & Auto-poll for successful account connection from Telegram Bot
  useEffect(() => {
    if (!isOpen) return;

    const handleTelegramLinked = (data) => {
      setJustLinked(true);
      toast.success('🎉 Telegram hisobingiz muvaffaqiyatli ulandi!');
      if (user) {
        setUser((prev) => ({ ...prev, telegramId: data.telegramId || 'connected' }));
      }
      setTimeout(() => {
        setJustLinked(false);
        onClose();
      }, 2500);
    };

    if (socketClient && typeof socketClient.on === 'function') {
      socketClient.on('telegram_linked', handleTelegramLinked);
    }

    // Polling fallback every 2.5 seconds while modal is open and not yet linked
    const pollInterval = setInterval(async () => {
      if (!user?.telegramId) {
        try {
          const res = await userApi.getTelegramLinkToken();
          if (res.data?.isLinked && res.data?.telegramId) {
            handleTelegramLinked({ telegramId: res.data.telegramId });
          }
        } catch (e) {
          // ignore poll error
        }
      }
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      if (socketClient && typeof socketClient.off === 'function') {
        socketClient.off('telegram_linked', handleTelegramLinked);
      }
    };
  }, [isOpen, user, setUser, toast, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!linkData?.link) return;
    navigator.clipboard.writeText(linkData.link);
    setCopied(true);
    toast.success('Havola nusxalandi!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlink = async () => {
    if (!window.confirm('Haqiqatan ham Telegram hisobini profilingizdan uzmoqchimisiz?')) return;
    setLoading(true);
    try {
      await userApi.unlinkTelegram();
      if (user) {
        setUser({ ...user, telegramId: null });
      }
      toast.info('Telegram hisob ajratildi.');
      onClose();
    } catch (err) {
      toast.error('Telegram hisobni ajratishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const isLinked = Boolean(user?.telegramId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#16181D] rounded-3xl shadow-2xl border border-[#E7E9ED] dark:border-[#272A30] overflow-hidden z-10 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-[#202328] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2E35] flex items-center justify-center text-[#6B7280] dark:text-[#9CA3AF] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {justLinked ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/20 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-xl font-bold text-[#17181A] dark:text-[#F3F4F6] mb-1">
              Muvaffaqiyatli ulandi!
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-xs">
              Sizning profilingiz rasmiy Telegram botimizga biriktirildi. Endi buyurtmalaringiz jonli xabarlar bilan keladi.
            </p>
          </div>
        ) : isLinked ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#17181A] dark:text-[#F3F4F6] mb-1">
              Telegram hisobingiz ulangan
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-6">
              Telegram ID: <span className="font-mono font-bold text-[#17181A] dark:text-[#E5E7EB]">{user.telegramId}</span>
            </p>

            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-left mb-6">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-2 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Faol imkoniyatlar:
              </p>
              <ul className="text-[11px] text-[#4B5563] dark:text-[#9CA3AF] space-y-1.5 pl-5 list-disc">
                <li>Buyurtma tasdiqlanganda va kuryerga berilganda tezkor xabarlar</li>
                <li>Telegram botda "Buyurtmalarim" va "Sevimlilar" ro‘yxati</li>
                <li>Keshbek hisoblari bildirishnomalari</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUnlink}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                Hisobni uzish
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 dark:bg-[#0088cc]/20 text-[#0088cc] flex items-center justify-center border border-[#0088cc]/20">
                <Send className="w-6 h-6 -rotate-12 translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#17181A] dark:text-[#F3F4F6] leading-tight">
                  Telegram hisobini ulash
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Buyurtmalaringizni 100% sinxron kuzating
                </p>
              </div>
            </div>

            {/* Benefit Badges */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F8FA] dark:bg-[#1E2024] border border-[#E7E9ED] dark:border-[#272A30]">
                <div className="w-7 h-7 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">
                    Jonli buyurtma xabarnomalari
                  </h4>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                    Oshxona tayyorlashi va kuryer yo‘lga chiqqani haqida xabarlar bevosita Telegramingizga keladi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F8FA] dark:bg-[#1E2024] border border-[#E7E9ED] dark:border-[#272A30]">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17181A] dark:text-[#F3F4F6]">
                    Bot orqali boshqaruv & Sevimlilar
                  </h4>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                    Saytda saqlagan sevimli tortlaringiz va hamyon balansingiz Telegram bot menyusida ko‘rinadi.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {loading ? (
              <div className="py-6 text-center text-xs text-[#6B7280]">
                Bog‘lanish havolasi tayyorlanmoqda...
              </div>
            ) : linkData?.link ? (
              <div className="space-y-3">
                <a
                  href={linkData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0088cc]/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram orqali ochish va ulash</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-xl bg-[#F7F8FA] dark:bg-[#1E2024] border border-[#E7E9ED] dark:border-[#272A30] text-[11px] font-mono text-[#6B7280] dark:text-[#9CA3AF] truncate select-all">
                    {linkData.link}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#202328] border border-[#E7E9ED] dark:border-[#2E3138] hover:bg-[#F3F4F6] text-xs font-medium text-[#17181A] dark:text-[#F3F4F6] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    💡 Bot: <b>@{linkData.botUsername || 'boltortlarbot'}</b> • Tugmani bosing yoki botga <code>{linkData.token}</code> kodini yuboring.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onClose()}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-semibold"
              >
                Qaytadan urinish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramLinkModal;
