import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Upload,
  HeartHandshake,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/common/Button';
import Cake3DViewer from '../../components/cake/Cake3DViewer';

const WEIGHT_OPTIONS = [
  { id: '1.0kg', weight: '1.0 kg', label: '1.0 kg (Kichik bayram)', servings: '4–6 kishi', basePrice: 220000 },
  { id: '1.5kg', weight: '1.5 kg', label: '1.5 kg (Oila davrasida)', servings: '8–10 kishi', basePrice: 310000 },
  { id: '2.0kg', weight: '2.0 kg', label: '2.0 kg (Katta oila / Tug‘ilgan kun)', servings: '12–15 kishi', basePrice: 400000 },
  { id: '3.0kg', weight: '3.0 kg', label: '3.0 kg (2 qavatli tantana)', servings: '18–22 kishi', basePrice: 580000 },
  { id: '5.0kg', weight: '5.0 kg', label: '5.0 kg (3 qavatli hashamat)', servings: '30+ kishi', basePrice: 950000 },
];

const BISCUIT_OPTIONS = [
  { id: 'vanilla', name: 'Klassik Madagaskar Vanilli', price: 0, desc: 'Yengil, yumshoq va xushbo‘y' },
  { id: 'chocolate', name: 'Belgiyacha Boy Shokoladli', price: 15000, desc: 'Haqiqiy kakao va to‘yingan ta’m' },
  { id: 'red_velvet', name: 'Qizil Baxmal (Red Velvet)', price: 25000, desc: 'Nafis kakao ohangi va yorqin rang' },
  { id: 'honey', name: 'Eksklyuziv Asalli (Medovik)', price: 20000, desc: 'Tog‘ asali va karamellashgan korjlar' },
  { id: 'nutty', name: 'Yong‘oqli va Dolchinli', price: 30000, desc: 'Yanchilgan yong‘oq va mayin qatlam' },
];

const CREAM_OPTIONS = [
  { id: 'cream_cheese', name: 'Klassik Krem-chiz (Cream Cheese)', price: 0, desc: 'Mayin pishloqli sufle' },
  { id: 'ganache', name: 'Belgiya Qora Shokoladli Ganash', price: 25000, desc: 'Haqiqiy shokolad va qaymoq' },
  { id: 'berry_souffle', name: 'Yovvoyi Qulupnayli Sufle', price: 20000, desc: 'Nordosh-shirin tabiiy pyure' },
  { id: 'pistachio', name: 'Eron Pistasi Ganashi', price: 45000, desc: 'Premium xushbo‘y pista kremi' },
  { id: 'caramel', name: 'Momiq Sho‘r Karamel', price: 20000, desc: 'Qaynatilgan xushbo‘y karamel' },
];

const FILLING_OPTIONS = [
  { id: 'none', name: 'Qo‘shimchasiz (Toza krem)', price: 0, desc: 'Faqat tanlangan nozik krem' },
  { id: 'strawberry', name: 'Yangi Qulupnay va Malina', price: 25000, desc: 'Meva bo‘laklari va qatlam' },
  { id: 'banana_caramel', name: 'Banan va Sho‘r Karamel', price: 20000, desc: 'Karamellashgan banan qatlami' },
  { id: 'crunchy_nut', name: 'Qovurilgan Yong‘oq & Bodom', price: 25000, desc: 'Qarsildoq karamel va yong‘oqlar' },
  { id: 'cherry_choco', name: 'Nordosh Olcha (Cherry Confit)', price: 20000, desc: 'Shokolad bilan ideal uyg‘unlik' },
];

const DECOR_OPTIONS = [
  { id: 'minimal', name: 'Minimalist bejirim bezak', price: 0, desc: 'Toza chiziqlar va tabiiy pardoz' },
  { id: 'berries', name: 'Yangi rezavor va mevalar', price: 35000, desc: 'Qulupnay, malina va ko‘katlar' },
  { id: 'gold_macarons', name: 'Oltin zar va fransuz makarunlari', price: 45000, desc: 'Yaltiroq zar va 4 ta makarun' },
  { id: 'choco_figures', name: 'Mualliflik shokolad figuralari', price: 30000, desc: 'Qo‘lda yasalgan shokolad bezaklari' },
];

const CustomCakePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToCart, setIsCartOpen } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(WEIGHT_OPTIONS[1]);
  const [selectedBiscuit, setSelectedBiscuit] = useState(BISCUIT_OPTIONS[0]);
  const [selectedCream, setSelectedCream] = useState(CREAM_OPTIONS[0]);
  const [selectedFilling, setSelectedFilling] = useState(FILLING_OPTIONS[1]);
  const [selectedDecor, setSelectedDecor] = useState(DECOR_OPTIONS[1]);
  const [greetingText, setGreetingText] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [isAdded, setIsAdded] = useState(false);

  // Live Dynamic Price Calculation
  const totalPrice =
    selectedWeight.basePrice +
    selectedBiscuit.price +
    selectedCream.price +
    selectedFilling.price +
    selectedDecor.price;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Rasm hajmi 5MB dan oshmasligi lozim.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = () => {
    const customCakeItem = {
      id: `custom-${Date.now()}`,
      name: `Maxsus Tort: ${selectedBiscuit.name} & ${selectedCream.name}`,
      categoryName: 'Maxsus tort',
      price: totalPrice,
      weight: selectedWeight.weight,
      image: referenceImage || '/hero-cake.jpg',
      isCustom: true,
      customSpecs: {
        weight: selectedWeight.weight,
        servings: selectedWeight.servings,
        biscuit: selectedBiscuit.name,
        cream: selectedCream.name,
        filling: selectedFilling.name,
        decor: selectedDecor.name,
        greetingText: greetingText.trim(),
        notes: notes.trim(),
        referenceImage,
      },
    };

    addToCart(customCakeItem, 1);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsCartOpen(true);
    }, 600);
  };

  const handleConsultTelegram = () => {
    const text = encodeURIComponent(
      `Assalomu alaykum! Saytingiz orqali maxsus tort buyurtma qilmoqchiman:\n` +
      `- Vazni: ${selectedWeight.weight} (${selectedWeight.servings})\n` +
      `- Biskvit: ${selectedBiscuit.name}\n` +
      `- Krem: ${selectedCream.name}\n` +
      `- Meva/Qo'shimcha: ${selectedFilling.name}\n` +
      `- Bezak: ${selectedDecor.name}\n` +
      (greetingText ? `- Tabrik matni: "${greetingText}"\n` : '') +
      `- Taxminiy narxi: ${totalPrice.toLocaleString()} so'm\n` +
      (notes ? `- Eslatma: ${notes}\n` : '')
    );
    window.open(`https://t.me/boltortlari_admin?text=${text}`, '_blank');
  };

  const steps = [
    { num: 1, title: t('custom_cake.steps.weight', 'Vazn') },
    { num: 2, title: t('custom_cake.steps.biscuit', 'Biskvit') },
    { num: 3, title: t('custom_cake.steps.cream', 'Krem') },
    { num: 4, title: t('custom_cake.steps.filling', 'Meva') },
    { num: 5, title: t('custom_cake.steps.decor', 'Bezak') },
    { num: 6, title: t('custom_cake.steps.inscription', 'Yozuv') },
    { num: 7, title: t('custom_cake.steps.summary', 'Rasm & Xulosa') },
  ];

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-[#FBFBFC] dark:bg-[#0F1012] text-[#111827] dark:text-[#F3F4F6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] text-xs font-bold mb-3 border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('custom_cake.badge', 'Interaktiv Tort Konstruktori')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t('custom_cake.title', 'O‘zingiz xohlagan tortni yarating')}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-2 leading-relaxed">
            {t('custom_cake.subtitle', 'Har bir qatlamni o‘zingiz tanlang, narxni real vaqtda kuzating va to‘g‘ridan-to‘g‘ri buyurtma bering.')}
          </p>
        </div>

        {/* 7-Step Stepper Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-[#E5E7EB] dark:bg-[#26282E] -z-0" />
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className="flex flex-col items-center gap-1 relative z-10 bg-[#FBFBFC] dark:bg-[#0F1012] px-1 sm:px-2 cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-subtle'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-[#BFDBFE] dark:ring-[#1E3A8A]'
                        : 'bg-white dark:bg-[#1E2024] border border-[#E5E7EB] dark:border-[#26282E] text-[#6B7280]'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium hidden sm:block ${
                      isCurrent
                        ? 'text-[#2563EB] font-bold'
                        : 'text-[#6B7280] dark:text-[#9CA3AF]'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Box with Live Calculation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Steps Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 sm:p-8 shadow-subtle">
              
              {/* STEP 1: Og'irligi & Hajmi */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step1_title', '1-qadam: Tort hajmi va og‘irligini tanlang')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step1_desc', 'Mehmonlar soniga qarab optimal vaznni belgilang.')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {WEIGHT_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedWeight(opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selectedWeight.id === opt.id
                            ? 'border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20 ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {opt.weight}
                          </span>
                          <span className="text-xs font-semibold text-[#2563EB]">
                            {opt.basePrice.toLocaleString()} {t('common.currency', 'so‘m')}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          {t('custom_cake.servings', 'Tavsiya:')} {opt.servings}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Biskvit Ta'mi */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step2_title', '2-qadam: Biskvit korjlari ta’mini tanlang')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step2_desc', 'Faqat tabiiy sariyog‘, yangi tuxum va sifatli un bilan yangi pishiriladi.')}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {BISCUIT_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedBiscuit(opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedBiscuit.id === opt.id
                            ? 'border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20 ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {opt.name}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {opt.desc}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {opt.price === 0 ? t('custom_cake.base_price', 'Baza narxida') : `+${opt.price.toLocaleString()} ${t('common.currency', 'so‘m')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Krem va Qatlam */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step3_title', '3-qadam: Nozik krem turini tanlang')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step3_desc', '82.5% toza qaymoq va Belgiya shokoladi asosida tayyorlanadi.')}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {CREAM_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedCream(opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedCream.id === opt.id
                            ? 'border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20 ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {opt.name}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {opt.desc}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {opt.price === 0 ? t('custom_cake.base_price', 'Baza narxida') : `+${opt.price.toLocaleString()} ${t('common.currency', 'so‘m')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Meva va Qo'shimchalar */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step4_title', '4-qadam: Meva va qo‘shimcha qatlamni tanlang')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step4_desc', 'Tort qatlamlari orasiga lazzat bag‘ishlovchi mevali yoki yong‘oqli qatlam.')}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {FILLING_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedFilling(opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedFilling.id === opt.id
                            ? 'border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20 ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-[#111827] dark:text-[#F3F4F6]">
                            {opt.name}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            {opt.desc}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {opt.price === 0 ? t('custom_cake.base_price', 'Baza narxida') : `+${opt.price.toLocaleString()} ${t('common.currency', 'so‘m')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Bezak Uslubi */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step5_title', '5-qadam: Tashqi bezatish uslubini tanlang')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step5_desc', 'Bayramona ko‘rinish uchun meva, makarun yoki shokolad figuralari.')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {DECOR_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedDecor(opt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedDecor.id === opt.id
                            ? 'border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20 ring-1 ring-[#2563EB]'
                            : 'border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#111827] dark:text-[#F3F4F6]">
                            {opt.name}
                          </span>
                          <span className="text-[11px] font-semibold text-[#2563EB]">
                            {opt.price === 0 ? t('custom_cake.free', 'Bepul') : `+${opt.price.toLocaleString()} ${t('common.currency', 'so‘m')}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: Yozuv & Tabrik */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step6_title', '6-qadam: Tort ustiga tabrik yozuvi')}</h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('custom_cake.step6_desc', 'Qandolatchi usta tomonidan shokolad bilan chiroyli xatda yoziladi (Bepul).')}
                  </p>

                  <div className="pt-2">
                    <label className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider block mb-1.5">
                      {t('custom_cake.greeting_label', 'Tabrik matni (Ixtiyoriy)')}
                    </label>
                    <input
                      type="text"
                      value={greetingText}
                      onChange={(e) => setGreetingText(e.target.value)}
                      placeholder={t('custom_cake.greeting_placeholder', 'Masalan: «Tug‘ilgan kuning bilan!»')}
                      maxLength={60}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1F2228] text-sm text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
                      <span>{t('custom_cake.greeting_note', 'Maxsus shokolad xati bilan bepul yoziladi.')}</span>
                      <span>{greetingText.length}/60 {t('custom_cake.chars', 'belgi')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Rasm yuklash va Eslatma */}
              {currentStep === 7 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold">{t('custom_cake.step7_title', '7-qadam: Referens rasm va Yakuniy eslatma')}</h3>
                  
                  {/* Photo upload */}
                  <div>
                    <label className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider block mb-1.5">
                      {t('custom_cake.reference_label', 'Namuna rasmi (Pinterest / Instagram / Internetdan)')}
                    </label>
                    <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 text-center hover:border-[#2563EB] transition-colors relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {referenceImage ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={referenceImage}
                            alt="Namuna"
                            className="w-32 h-32 object-cover rounded-xl shadow-subtle mb-2"
                          />
                          <span className="text-xs font-semibold text-[#2563EB]">
                            {t('custom_cake.reference_uploaded', 'Rasm yuklandi. O‘zgartirish uchun bosing.')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-[#9CA3AF] mb-2" />
                          <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6]">
                            {t('custom_cake.reference_drop', 'Faylni bu yerga tashlang yoki tanlang')}
                          </span>
                          <span className="text-[11px] text-[#6B7280] mt-1">
                            {t('custom_cake.reference_limit', 'JPG, PNG format (Maksimal 5MB)')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional notes */}
                  <div>
                    <label className="text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider block mb-1.5">
                      {t('custom_cake.notes_label', 'Qandolatchiga qo‘shimcha tilaklar yoki eslatmalar')}
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('custom_cake.notes_placeholder', 'Masalan: Ranglar ochroq pushti bo‘lsin, shamchalar qo‘shib yuborilsin...')}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] bg-[#FBFBFC] dark:bg-[#1F2228] text-sm text-[#111827] dark:text-[#F3F4F6] focus:border-[#2563EB] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#E5E7EB] dark:border-[#26282E]">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    icon={ArrowLeft}
                  >
                    {t('custom_cake.btn_back', 'Orqaga')}
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 7 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                  >
                    <span>{t('custom_cake.btn_next', 'Keyingi bosqich')}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConsultTelegram}
                      className="px-3.5 py-2 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('custom_cake.btn_telegram', 'Qandolatchi bilan kelishish')}</span>
                    </button>

                    <Button
                      variant="primary"
                      onClick={handleAddToCart}
                      icon={ShoppingBag}
                    >
                      {isAdded ? t('custom_cake.btn_added', 'Savatga qo‘shildi!') : t('custom_cake.btn_add_cart', 'Savatga qo‘shish')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Live 3D Studio & Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-20 space-y-4">
              {/* Real-Time Interactive 3D Cake Studio */}
              <Cake3DViewer
                weightId={selectedWeight.id}
                biscuitId={selectedBiscuit.id}
                creamId={selectedCream.id}
                decorId={selectedDecor.id}
                greetingText={greetingText}
              />

              {/* Specs & Price Card */}
              <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-5 sm:p-6 shadow-subtle space-y-4">
              <h4 className="text-base font-bold pb-3 border-b border-[#E5E7EB] dark:border-[#26282E]">
                {t('custom_cake.specs_title', 'Tortingiz Spetsifikatsiyasi')}
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">1. {t('custom_cake.steps.weight', 'Og‘irlik')}:</span>
                  <span className="font-bold">{selectedWeight.weight} ({selectedWeight.servings})</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">2. {t('custom_cake.steps.biscuit', 'Biskvit')}:</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedBiscuit.name}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">3. {t('custom_cake.steps.cream', 'Krem')}:</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedCream.name}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">4. {t('custom_cake.steps.filling', 'Meva/Qo‘shimcha')}:</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedFilling.name}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">5. {t('custom_cake.steps.decor', 'Bezak')}:</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedDecor.name}</span>
                </div>
                {greetingText && (
                  <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#26282E]">
                    <span className="text-[#6B7280] block mb-0.5">6. {t('custom_cake.steps.inscription', 'Tabrik yozuvi')}:</span>
                    <span className="italic text-xs text-[#2563EB]">«{greetingText}»</span>
                  </div>
                )}
              </div>

              {/* Total Price Display */}
              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#26282E]">
                <div className="text-[10px] uppercase font-bold text-[#6B7280] mb-0.5 tracking-wider">
                  {t('custom_cake.estimated_price', 'Taxminiy hisoblangan narx')}
                </div>
                <div className="text-2xl font-extrabold text-[#2563EB]">
                  {totalPrice.toLocaleString()} {t('common.currency', 'so‘m')}
                </div>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 block">
                  {t('custom_cake.specs_note', '* Murakkab individual bezaklar narxi qandolatchi bilan tasdiqlanadi.')}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  onClick={handleAddToCart}
                  icon={ShoppingBag}
                  className="w-full shadow-subtle"
                >
                  {isAdded ? t('custom_cake.btn_added', 'Savatga qo‘shildi!') : t('custom_cake.btn_add_cart', 'Savatga qo‘shish')}
                </Button>

                <button
                  type="button"
                  onClick={handleConsultTelegram}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] text-xs font-semibold text-[#0088cc] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('custom_cake.btn_telegram', 'Qandolatchi bilan kelishish')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CustomCakePage;
