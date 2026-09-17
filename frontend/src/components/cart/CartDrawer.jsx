import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  User,
  CreditCard,
  Loader2,
  Tag,
  Check,
  Clock,
  Map,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi, promoApi } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { handleImageError, DEFAULT_CAKE_IMAGE } from '../../utils/imageFallback';
import PaymentModal from '../payment/PaymentModal';
import LocationPickerModal from '../map/LocationPickerModal';

const CartDrawer = ({ onAuthRequired }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartCount,
  } = useCart();

  // 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Geolocation & Map states (MUST be declared before any conditional return)
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [locationCoords, setLocationCoords] = useState({ lat: 0, lng: 0 });

  // Form fields
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '+998 ',
    customer_email: '',
    customer_address: '',
    notes: '',
    payment_method: 'cash',
  });

  // Prefill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
        customer_phone: prev.customer_phone === '+998 ' ? (user.phone || '+998 ') : prev.customer_phone,
      }));
    }
  }, [user, isCartOpen]);

  // Reset step when drawer closes
  const handleClose = () => {
    setIsCartOpen(false);
    if (step === 'success') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  };

  // Calculate discount and delivery
  const discountAmount = appliedPromo
    ? Math.round((cartSubtotal * (appliedPromo.discountPercent || 0)) / 100)
    : 0;
  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const deliveryFee = discountedSubtotal > 0 ? (discountedSubtotal >= 300000 ? 0 : 15000) : 0;
  const grandTotal = discountedSubtotal + deliveryFee;

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await promoApi.validate(promoInput.trim(), cartSubtotal);
      if (res.data?.valid) {
        setAppliedPromo(res.data.promo || { code: promoInput.toUpperCase(), discountPercent: res.data.discountPercent || 10 });
        setPromoError('');
      } else {
        setPromoError(res.data?.message || 'Ushbu promokod yaroqsiz.');
      }
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Promokod mavjud emas yoki muddati o‘tgan.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || '';
          const district = data.address?.county || data.address?.city || data.address?.state || '';
          const fullAddress = road ? `${district}, ${road}` : data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData((prev) => ({ ...prev, customer_address: fullAddress }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            customer_address: `Joylashuv: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setErrorMessage('Joylashuvni aniqlab bo‘lmadi. Xaritadan o‘zingiz belgilang.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const processOrderCreation = async (paymentDetails = {}) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || undefined,
        customer_address: formData.customer_address.trim(),
        location_lat: locationCoords.lat || undefined,
        location_lng: locationCoords.lng || undefined,
        notes: formData.notes.trim() || undefined,
        payment_method: paymentDetails.payment_method || formData.payment_method,
        payment_status: paymentDetails.payment_status || 'pending',
        payment_ref: paymentDetails.payment_ref || undefined,
        promoCode: appliedPromo?.code || undefined,
        discountAmount: discountAmount || undefined,
        items: cart.map((item) => ({
          id: item._id || item.id,
          name: item.name,
          weight: item.weight || (item.customSpecs && item.customSpecs.weight) || '1.5 kg',
          price: item.price,
          quantity: item.quantity,
          isCustom: Boolean(item.isCustom),
          customSpecs: item.customSpecs || undefined,
        })),
        total_price: grandTotal,
      };

      const response = await orderApi.create(orderPayload);
      const createdOrder = response.data.order;

      setConfirmedOrder(createdOrder);
      clearCart();
      setAppliedPromo(null);
      setPromoInput('');
      setStep('success');
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Order placement error:', err);
      setErrorMessage(
        err.response?.data?.error || t('cart.error_submit', 'Buyurtmani yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      if (onAuthRequired) onAuthRequired();
      setErrorMessage(t('cart.error_auth', 'Buyurtma berish uchun avval tizimga kiring yoki ro‘yxatdan o‘ting.'));
      return;
    }

    if (!formData.customer_name.trim()) {
      setErrorMessage(t('cart.error_name', 'Iltimos, ismingizni kiriting.'));
      return;
    }
    const cleanPhone = formData.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setErrorMessage(t('cart.error_phone', 'Iltimos, to‘g‘ri telefon raqam kiriting (kamida 9 ta raqam).'));
      return;
    }
    if (!formData.customer_address.trim()) {
      setErrorMessage(t('cart.error_address', 'Iltimos, yetkazib berish manzilini kiriting.'));
      return;
    }

    // If online payment (card / payme / click) -> Open Payment Modal FIRST
    if (formData.payment_method !== 'cash') {
      setIsPaymentModalOpen(true);
      return;
    }

    // If cash -> create directly
    await processOrderCreation({
      payment_method: 'cash',
      payment_status: 'pending',
    });
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6">
        <div className="w-screen max-w-md bg-white dark:bg-[#16181D] border-l border-[#E5E7EB] dark:border-[#26282E] shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200">
          
          {/* HEADER */}
          <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#26282E] flex items-center justify-between bg-[#FBFBFC] dark:bg-[#1F2228]">
            <div className="flex items-center gap-2">
              {step === 'checkout' ? (
                <button
                  onClick={() => setStep('cart')}
                  className="p-1 -ml-1 text-[#6B7280] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors cursor-pointer"
                  title={t('cart.back_to_cart', 'Savatga qaytish')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
              )}
              <h3 className="font-bold text-base text-[#111827] dark:text-[#F3F4F6]">
                {step === 'cart' && t('cart.title', 'Savatcha')}
                {step === 'checkout' && t('cart.checkout_title', 'Buyurtmani Rasmiylashtirish')}
                {step === 'success' && t('cart.success_title', 'Buyurtma Qabul Qilindi')}
              </h3>
              {step === 'cart' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-bold">
                  {cartCount} ta
                </span>
              )}
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#E5E7EB]/50 dark:hover:bg-[#282B32] transition-colors cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BODY: STEP 1 - CART ITEMS */}
          {step === 'cart' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#F3F4F6] dark:divide-[#24272D]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center mb-3">
                      <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <h4 className="font-bold text-base text-[#111827] dark:text-[#F3F4F6] mb-1">
                      {t('cart.empty_title', 'Savatingiz bo‘sh')}
                    </h4>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mb-6">
                      {t('cart.empty_desc', 'Katalogimizdan sevimli tortingizni tanlang va buyurtma bering!')}
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-subtle"
                    >
                      {t('cart.browse_cakes', 'Katalogga o‘tish')} →
                    </button>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemId = item.cartItemId || item.id;
                    return (
                      <div key={itemId} className="py-4 flex gap-3.5 first:pt-0 last:pb-0">
                        {/* Thumbnail */}
                        <img
                          src={item.image || DEFAULT_CAKE_IMAGE}
                          alt={item.name}
                          onError={handleImageError}
                          className="w-16 h-16 rounded-xl object-cover bg-[#F3F4F6] shrink-0 border border-[#E5E7EB] dark:border-[#26282E]"
                        />

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-xs sm:text-sm text-[#111827] dark:text-[#F3F4F6] line-clamp-1">
                                {item.name}
                              </h5>
                              <button
                                onClick={() => removeFromCart(itemId)}
                                className="text-[#9CA3AF] hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                title="O‘chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                              {t('cake.weight', 'Vazni')}:{' '}
                              <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">
                                {item.weight || (item.customSpecs && item.customSpecs.weight) || '1.5 kg'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            {/* Quantity Stepper */}
                            <div className="inline-flex items-center border border-[#E5E7EB] dark:border-[#26282E] rounded-lg bg-[#FBFBFC] dark:bg-[#1F2228]">
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                className="w-6 h-6 text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center justify-center cursor-pointer"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                className="w-6 h-6 text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cart Summary, Promo & Next Action */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1F2228] space-y-3">
                  {/* Promo Code Input Bar */}
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder={t('cart.promo_placeholder', 'Promokod (masalan: BOL10)')}
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs outline-none focus:border-[#2563EB] uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('cart.apply', 'Qo‘llash')}
                    </button>
                  </form>

                  {appliedPromo && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> {t('cart.promo_applied', 'Promokod qo‘llandi')}: {appliedPromo.code} ({appliedPromo.discountPercent}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedPromo(null)}
                        className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-[10px] underline"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {promoError}
                    </p>
                  )}

                  {/* Summary Rows */}
                  <div className="space-y-1.5 pt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <div className="flex justify-between">
                      <span>{t('cart.subtotal', 'Mahsulotlar jami:')}</span>
                      <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        {formatPrice(cartSubtotal)}
                      </span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>{t('cart.discount', 'Chegirma')} ({appliedPromo.discountPercent}%):</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>{t('cart.delivery_fee', 'Yetkazib berish:')}</span>
                      <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-600 font-bold">{t('cart.free', 'Bepul')}</span>
                        ) : (
                          formatPrice(deliveryFee)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#26282E] flex justify-between text-sm font-bold text-[#111827] dark:text-[#F3F4F6]">
                    <span>{t('cart.grand_total', 'Umumiy to‘lov:')}</span>
                    <span className="text-[#2563EB] text-base">{formatPrice(grandTotal)}</span>
                  </div>

                  {!user && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between gap-2">
                      <div className="text-amber-800 dark:text-amber-300">
                        <span className="font-bold block">Tizimga kirish talab qilinadi</span>
                        <span>Buyurtma berish uchun avval profilingizga kiring.</span>
                      </div>
                      <button
                        type="button"
                        onClick={onAuthRequired}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors"
                      >
                        Kirish
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        if (!user) {
                          if (onAuthRequired) onAuthRequired();
                          return;
                        }
                        setStep('checkout');
                      }}
                      className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{t('cart.proceed', 'Buyurtmani rasmiylashtirish')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* BODY: STEP 2 - CHECKOUT FORM */}
          {step === 'checkout' && (
            <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1">
                    {t('cart.name', 'Ism va familiyangiz')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      placeholder={t('cart.name_placeholder', 'Jasur Alimov')}
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full pl-11 pr-3 py-2.5 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1">
                    {t('cart.phone', 'Telefon raqamingiz')} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      name="customer_phone"
                      required
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder={t('cart.phone_placeholder', '+998 90 123 45 67')}
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full pl-11 pr-3 py-2.5 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email (For Nodemailer Receipt) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      {t('cart.email', 'Elektron pochta (Email)')}
                    </label>
                    <span className="text-[10px] text-[#2563EB] font-medium">
                      {t('cart.email_receipt_hint', 'Elektron chek yuboriladi')}
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="jasur@example.com"
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full pl-11 pr-3 py-2.5 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      {t('cart.address', 'Yetkazib berish manzili')} *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50 text-[#2563EB] dark:text-[#93C5FD] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#BFDBFE]/60 dark:border-[#1E3A8A]"
                        title="Xaritada joylashuvni tanlash"
                      >
                        <Map className="w-3 h-3" />
                        <span>🗺️ Xarita</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="px-2 py-1 rounded-lg bg-[#F3F4F6] dark:bg-[#1F2228] hover:bg-[#E5E7EB] dark:hover:bg-[#26282E] text-[#4B5563] dark:text-[#9CA3AF] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="GPS orqali joriy joylashuvni aniqlash"
                      >
                        <MapPin className="w-3 h-3 text-[#2563EB]" />
                        <span>{detectingLocation ? 'Aniqlanmoqda...' : '📍 GPS'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3 pointer-events-none" />
                    <textarea
                      name="customer_address"
                      required
                      rows={2}
                      value={formData.customer_address}
                      onChange={handleInputChange}
                      placeholder={t('cart.address_placeholder', 'Farg‘ona viloyati, Uchko‘prik tumani, Mustaqillik ko‘chasi, 12-uy')}
                      style={{ paddingLeft: '2.75rem', paddingTop: '0.625rem' }}
                      className="w-full pl-11 pr-3 py-2.5 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none resize-none transition-colors"
                    />
                  </div>
                </div>

                {/* Notes / Cake Inscription */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1">
                    {t('cart.notes', 'Tort ustiga tabrik matni yoki qo‘shimcha tilaklar')}
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={t('cart.notes_placeholder', 'Masalan: «Tug‘ilgan kuningiz bilan, Onajon!»')}
                    className="w-full px-3.5 py-2 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1.5">
                    {t('cart.payment_method', 'To‘lov usuli')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: t('cart.cash', 'Naqd to‘lov'), sub: t('cart.cash_sub', 'Kuryerga') },
                      { id: 'card', label: t('cart.card', 'Bank kartasi'), sub: 'Uzcard / Humo' },
                      { id: 'payme', label: t('cart.payme', 'Payme'), sub: 'Ilova orqali' },
                      { id: 'click', label: t('cart.click', 'Click'), sub: 'Ilova orqali' },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex flex-col p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                          formData.payment_method === method.id
                            ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 text-[#2563EB] font-bold shadow-subtle'
                            : 'border-[#E5E7EB] dark:border-[#26282E] text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.id}
                          checked={formData.payment_method === method.id}
                          onChange={handleInputChange}
                          className="hidden"
                        />
                        <span className="font-semibold">{method.label}</span>
                        <span className="text-[10px] opacity-75 font-normal">{method.sub}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Bar */}
              <div className="p-4 sm:p-5 border-t border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1F2228] space-y-2.5">
                <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  <span>{t('cart.grand_total', 'Jami to‘lov miqdori:')}</span>
                  <span className="text-sm font-bold text-[#2563EB]">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-400 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('cart.submitting', 'Buyurtma yuborilmoqda...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('cart.confirm_order', 'Buyurtmani Tasdiqlash')}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* BODY: STEP 3 - SUCCESS NOTIFICATION */}
          {step === 'success' && confirmedOrder && (
            <div className="flex-1 flex flex-col justify-between p-6">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-8 h-8 stroke-[2]" />
                </div>

                <h4 className="font-bold text-lg text-[#111827] dark:text-[#F3F4F6] mb-1">
                  {t('cart.success_title', 'Buyurtmangiz Qabul Qilindi!')}
                </h4>

                <div className="my-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-mono font-bold text-xs border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
                  #{confirmedOrder.orderId || confirmedOrder.id}
                </div>

                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mt-2 leading-relaxed">
                  {t('cart.thank_you', 'Rahmat')}, <strong className="text-[#111827] dark:text-[#F3F4F6]">{confirmedOrder.customer_name}</strong>!
                  {' '}{t('cart.order_placed_desc', 'Buyurtmangiz qandolatchi ustaxonamizga yetib bordi.')}
                </p>

                {confirmedOrder.customer_email && (
                  <div className="mt-4 p-3 bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl text-xs text-[#4B5563] dark:text-[#9CA3AF] flex items-center gap-2 text-left">
                    <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>
                      {t('cart.receipt_sent_to', 'Tasdiqlov cheki yuborildi')}: <strong className="text-[#111827] dark:text-[#F3F4F6]">{confirmedOrder.customer_email}</strong>
                    </span>
                  </div>
                )}

                <div className="mt-4 w-full bg-[#FBFBFC] dark:bg-[#1F2228] border border-[#E5E7EB] dark:border-[#26282E] rounded-xl p-3.5 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span>{t('cart.grand_total', 'To‘lov summasi:')}</span>
                    <span className="font-bold text-[#111827] dark:text-[#F3F4F6]">{formatPrice(confirmedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span>{t('cart.address', 'Yetkazish manzili')}:</span>
                    <span className="font-medium text-[#111827] dark:text-[#F3F4F6] text-right line-clamp-1">{confirmedOrder.customer_address}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280] dark:text-[#9CA3AF]">
                    <span>{t('orders.order_details', 'Buyurtma holati')}:</span>
                    <span className="text-emerald-600 font-bold">{t('orders.stage_confirmed', 'Qabul qilindi')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                {confirmedOrder.payment_status === 'paid' ? (
                  <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> {t('cart.payment_successful', 'To‘lov muvaffaqiyatli qabul qilindi')}
                  </div>
                ) : confirmedOrder.payment_method !== 'cash' ? (
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{t('cart.pay_now', 'Hoziroq to‘lash')} ({formatPrice(confirmedOrder.total)})</span>
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    handleClose();
                    navigate('/orders');
                  }}
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>{t('cart.track_button', 'Buyurtmani kuzatish')}</span>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-[#FBFBFC] dark:bg-[#1F2228] hover:bg-[#E5E7EB] dark:hover:bg-[#282B32] text-[#111827] dark:text-[#F3F4F6] border border-[#E5E7EB] dark:border-[#26282E] text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {t('cart.continue_button', 'Xaridni davom ettirish')}
                </button>
              </div>
            </div>
          )}

          {/* Real Payment Modal */}
          {confirmedOrder && (
            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              amount={confirmedOrder.total}
              orderId={confirmedOrder.orderId || confirmedOrder.id}
              onSuccess={(res) => {
                setConfirmedOrder((prev) => ({
                  ...prev,
                  payment_status: 'paid',
                  payment_method: res.cardBrand || prev.payment_method,
                }));
              }}
            />
          )}

          {/* In-App Interactive Map Modal */}
          <LocationPickerModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            initialAddress={formData.customer_address}
            onSelectLocation={({ address, lat, lng }) => {
              setFormData((prev) => ({ ...prev, customer_address: address }));
              setLocationCoords({ lat, lng });
            }}
          />

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
