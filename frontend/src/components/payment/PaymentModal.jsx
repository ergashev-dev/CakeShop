import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { paymentApi } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import Button from '../common/Button';

const PaymentModal = ({
  isOpen,
  onClose,
  amount,
  orderId,
  isWalletTopUp = false,
  onSuccess,
}) => {
  const [provider, setProvider] = useState('card'); // 'card' | 'payme' | 'click'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Card form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  if (!isOpen) return null;

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
    setError(null);
  };

  // Format Expire Date (MM/YY)
  const handleExpireDateChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpireDate(val);
    setError(null);
  };

  // Detect Card Brand
  const cleanNum = cardNumber.replace(/\s+/g, '');
  let cardBrand = 'Karta';
  let brandColor = 'from-stone-800 to-stone-900';
  if (cleanNum.startsWith('8600')) {
    cardBrand = 'Uzcard';
    brandColor = 'from-blue-700 via-indigo-800 to-stone-950';
  } else if (cleanNum.startsWith('9860')) {
    cardBrand = 'Humo';
    brandColor = 'from-amber-600 via-orange-700 to-stone-950';
  } else if (cleanNum.startsWith('4')) {
    cardBrand = 'Visa';
    brandColor = 'from-blue-900 via-sky-800 to-indigo-950';
  } else if (/^(5[1-5]|2[2-7])/.test(cleanNum)) {
    cardBrand = 'Mastercard';
    brandColor = 'from-rose-800 via-amber-700 to-stone-950';
  }

  // Handle Direct Card Submission
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (cleanNum.length < 16) {
      setError('Karta raqami 16 ta raqamdan iborat bo‘lishi lozim.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expireDate)) {
      setError('Amal qilish muddati noto‘g‘ri (masalan, 12/28).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await paymentApi.processCardPayment({
        orderId,
        cardNumber: cleanNum,
        expireDate,
        cardHolder: cardHolder.trim() || 'Mijoz',
        amount,
        isWalletTopUp,
      });

      setSuccessData(res.data);
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'To‘lovni amalga oshirishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Payme or Click Checkout Redirect
  const handleProviderCheckout = async (selectedProvider) => {
    setLoading(true);
    setError(null);

    try {
      const res = await paymentApi.createPaymentUrl({
        provider: selectedProvider,
        orderId,
        amount,
        isWalletTopUp,
        returnUrl: window.location.origin + (isWalletTopUp ? '/profile' : '/profile?tab=orders'),
      });

      if (res.data?.paymentUrl) {
        // Open payment link
        window.open(res.data.paymentUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'To‘lov tizimi havolasini ochishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setSuccessData(null);
    setError(null);
    setCardNumber('');
    setExpireDate('');
    setCardHolder('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={handleModalClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 p-1.5 text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. SUCCESS STATE */}
        {successData ? (
          <div className="text-center py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-bold text-[#17181A] dark:text-[#F3F4F6] mb-1">
              To‘lov Muvaffaqiyatli Amalga Oshirildi!
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto mb-5">
              {successData.message || 'Mablag‘ muvaffaqiyatli qabul qilindi.'}
            </p>

            <div className="bg-[#F7F8FA] dark:bg-[#1F2227] border border-[#E7E9ED] dark:border-[#2E3138] rounded-xl p-4 text-xs space-y-2 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">To‘lov usuli:</span>
                <span className="font-bold text-[#17181A] dark:text-[#F3F4F6]">
                  {successData.cardBrand || 'Bank kartasi'} ({successData.cardMask || 'Tasdiqlangan'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Tranzaksiya ID:</span>
                <span className="font-mono font-bold text-[#2563EB]">{successData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Summa:</span>
                <span className="font-black text-emerald-600">{formatPrice(amount)}</span>
              </div>
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Buyurtma kodi:</span>
                  <span className="font-bold text-[#17181A] dark:text-[#F3F4F6]">#{orderId}</span>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleModalClose}
            >
              Yopish
            </Button>
          </div>
        ) : (
          /* 2. PAYMENT FORM STATE */
          <div>
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#17181A] dark:text-[#F3F4F6]">
                  {isWalletTopUp ? 'Hamyonni To‘ldirish' : 'Buyurtma Uchun To‘lov'}
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                <span>
                  {orderId ? `Buyurtma: #${orderId}` : 'Onlayn to‘lov tizimi'}
                </span>
                <span className="text-base font-black text-[#2563EB] dark:text-blue-400">
                  {formatPrice(amount)}
                </span>
              </div>
            </div>

            {/* Provider Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#F7F8FA] dark:bg-[#1E2026] border border-[#E7E9ED] dark:border-[#2E3138] rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setProvider('card')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  provider === 'card'
                    ? 'bg-white dark:bg-[#16181D] text-[#2563EB] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#17181A] dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Karta</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('payme')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  provider === 'payme'
                    ? 'bg-white dark:bg-[#16181D] text-cyan-600 shadow-xs'
                    : 'text-[#6B7280] hover:text-[#17181A] dark:hover:text-white'
                }`}
              >
                <span className="font-extrabold tracking-tight">Payme</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('click')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  provider === 'click'
                    ? 'bg-white dark:bg-[#16181D] text-blue-500 shadow-xs'
                    : 'text-[#6B7280] hover:text-[#17181A] dark:hover:text-white'
                }`}
              >
                <span className="font-extrabold tracking-tight">Click</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* TAB 1: DIRECT CARD PAYMENT */}
            {provider === 'card' && (
              <form onSubmit={handleCardSubmit} className="space-y-4">
                {/* Interactive 3D Card Visual */}
                <div
                  className={`relative w-full h-44 rounded-2xl bg-gradient-to-tr ${brandColor} text-white p-5 shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-300`}
                >
                  {/* Subtle Card Background Pattern */}
                  <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  <div className="absolute left-1/3 top-0 w-32 h-32 rounded-full bg-white/5 blur-lg pointer-events-none" />

                  {/* Top row: Chip and Brand */}
                  <div className="flex justify-between items-center z-10">
                    <div className="w-10 h-7 rounded bg-amber-300/80 border border-amber-200/50 flex items-center justify-center">
                      <div className="w-7 h-4 border border-amber-600/40 rounded-xs" />
                    </div>
                    <span className="font-mono text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs border border-white/20">
                      {cardBrand}
                    </span>
                  </div>

                  {/* Middle row: Card Number */}
                  <div className="z-10 tracking-widest font-mono text-lg font-bold">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  {/* Bottom row: Holder & Expiry */}
                  <div className="flex justify-between items-end z-10 text-xs">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-white/60">Karta egasi</div>
                      <div className="font-semibold uppercase tracking-wide truncate max-w-[170px]">
                        {cardHolder || 'ISMI FAMILIYASI'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-white/60">Amal qilishi</div>
                      <div className="font-mono font-bold">{expireDate || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">
                      Karta raqami (16 ta raqam)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="8600 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">
                        Amal qilish muddati
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expireDate}
                        onChange={handleExpireDateChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] mb-1">
                        Karta egasining ismi
                      </label>
                      <input
                        type="text"
                        placeholder="Masalan, ALI VALIYEV"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1F2227] text-xs font-semibold uppercase outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] pt-1">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    256-bit SSL xavfsiz shifrlash
                  </span>
                  <span className="font-semibold text-stone-500">3D-Secure</span>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>To‘lov amalga oshirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>{formatPrice(amount)} to‘lash</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* TAB 2: PAYME */}
            {provider === 'payme' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center mx-auto font-black text-xl">
                  P
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#17181A] dark:text-[#F3F4F6]">
                    Payme Orqali To‘lov
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mx-auto mt-1">
                    Rasmiy Payme to‘lov sahifasiga o‘tish orqali to‘lovni xavfsiz va bir zumda bajaring.
                  </p>
                </div>

                <div className="p-3 bg-[#F7F8FA] dark:bg-[#1F2227] rounded-xl text-xs flex justify-between items-center font-semibold">
                  <span className="text-[#6B7280]">To‘lov summasi:</span>
                  <span className="text-sm font-bold text-cyan-600">{formatPrice(amount)}</span>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  onClick={() => handleProviderCheckout('payme')}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Payme sahifasiga o‘tish</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* TAB 3: CLICK */}
            {provider === 'click' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto font-black text-xl">
                  C
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#17181A] dark:text-[#F3F4F6]">
                    Click Evolution Orqali To‘lov
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mx-auto mt-1">
                    Click ilovasi yoki veb-sahifasi orqali hisobingizdan tezkor to‘lov qiling.
                  </p>
                </div>

                <div className="p-3 bg-[#F7F8FA] dark:bg-[#1F2227] rounded-xl text-xs flex justify-between items-center font-semibold">
                  <span className="text-[#6B7280]">To‘lov summasi:</span>
                  <span className="text-sm font-bold text-blue-600">{formatPrice(amount)}</span>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  onClick={() => handleProviderCheckout('click')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Click sahifasiga o‘tish</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
