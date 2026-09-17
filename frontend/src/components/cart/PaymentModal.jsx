import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const PaymentModal = ({ isOpen, onClose, totalAmount, onPaymentSuccess }) => {
  const [method, setMethod] = useState('card'); // 'card' | 'payme' | 'click'
  const [step, setStep] = useState('input'); // 'input' | 'sms' | 'processing' | 'success'
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [phone, setPhone] = useState('+998 ');
  
  // SMS Code
  const [smsCode, setSmsCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('7429');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Format into 4-4-4-4
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
    setError('');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
    setError('');
  };

  const handleSendSms = (e) => {
    e.preventDefault();
    setError('');

    if (method === 'card') {
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length !== 16) {
        setError('Karta raqami 16 ta raqamdan iborat bo‘lishi lozim.');
        return;
      }
      if (cardExpiry.length !== 5) {
        setError('Amal qilish muddatini to‘liq kiriting (MM/YY).');
        return;
      }
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        setError('Telefon raqamini to‘liq kiriting.');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      // Generate a mock 4-digit code and proceed to SMS step
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setStep('sms');
      setLoading(false);
    }, 800);
  };

  const handleVerifySms = (e) => {
    e.preventDefault();
    if (smsCode.trim() !== generatedCode && smsCode.trim() !== '1234') {
      setError('SMS tasdiqlash kodi noto‘g‘ri kiritildi.');
      return;
    }

    setError('');
    setStep('processing');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess({
          payment_method: method,
          payment_status: 'paid',
          payment_ref: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        });
      }, 900);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E9ED] dark:border-[#272A30]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Xavfsiz Onlayn To‘lov
              </h3>
              <p className="text-[11px] text-[#6B7280]">Uzcard • Humo • Payme • Click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#17181A] dark:hover:text-white cursor-pointer"
            title="Bekor qilish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount to pay */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-[#1E3A8A]/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
          <span className="text-[#4B5563] dark:text-[#9CA3AF] font-medium">To‘lov summasi:</span>
          <span className="text-base font-extrabold text-[#2563EB] dark:text-[#93C5FD]">
            {formatPrice(totalAmount)}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: METHOD SELECTION & INPUT */}
        {step === 'input' && (
          <form onSubmit={handleSendSms} className="space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'card', label: 'Bank kartasi', sub: 'Uzcard/Humo' },
                { id: 'payme', label: 'Payme', sub: 'Ilova' },
                { id: 'click', label: 'Click', sub: 'Ilova' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => { setMethod(m.id); setError(''); }}
                  className={`py-2 px-2 rounded-xl text-xs border text-center transition-all cursor-pointer ${
                    method === m.id
                      ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-900/20 text-[#2563EB] font-bold shadow-xs'
                      : 'border-[#E7E9ED] dark:border-[#272A30] text-[#6B7280] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[9px] opacity-70">{m.sub}</div>
                </button>
              ))}
            </div>

            {/* Card Inputs */}
            {method === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                    Karta raqami (16 ta raqam)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="8600 0000 0000 0000"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs font-mono font-bold tracking-wider outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                    Amal qilish muddati (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="12/28"
                    maxLength={5}
                    className="w-32 px-3.5 py-2 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs font-mono font-bold outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            )}

            {/* Payme / Click Phone Input */}
            {(method === 'payme' || method === 'click') && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                  {method === 'payme' ? 'Payme' : 'Click'} ulangan telefon raqami
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-xs font-bold outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>To‘lov bank shifrlangan xavfsiz kanali orqali amalga oshiriladi</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-subtle cursor-pointer btn-press"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>SMS Kodni olish va to‘lash</span>
            </button>
          </form>
        )}

        {/* STEP 2: SMS CONFIRMATION CODE */}
        {step === 'sms' && (
          <form onSubmit={handleVerifySms} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              <div className="font-bold mb-0.5">Tasdiqlash kodi yuborildi!</div>
              <div>Telefoningizga SMS orqali 4 xonali kod bordi.</div>
              <div className="text-[11px] font-mono mt-1 text-[#2563EB] font-bold">
                (Test rejimi kodi: <span className="underline">{generatedCode}</span>)
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4B5563] dark:text-[#9CA3AF] mb-1">
                4 xonali SMS kodni kiriting
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={4}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="• • • •"
                className="w-full text-center tracking-[0.5em] px-4 py-3 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1E2024] text-lg font-mono font-black outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 py-2.5 rounded-xl border border-[#E7E9ED] dark:border-[#272A30] text-xs font-semibold text-[#6B7280]"
              >
                Orqaga
              </button>
              <button
                type="submit"
                disabled={loading || smsCode.length < 4}
                className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-subtle cursor-pointer btn-press"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>To‘lovni tasdiqlash</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-10 h-10 text-[#2563EB] mx-auto animate-spin" />
            <div className="text-sm font-bold text-[#17181A] dark:text-[#F3F4F6]">
              To‘lov qabul qilinmoqda...
            </div>
            <p className="text-xs text-[#6B7280]">Bank va hisobingiz bilan bog‘lanilmoqda</p>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              To‘lov Muvaffaqiyatli Amalga Oshirildi!
            </div>
            <p className="text-xs text-[#6B7280]">Buyurtmangiz tasdiqlanmoqda...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
