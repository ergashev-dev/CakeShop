import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  ShoppingBag,
  MapPin,
  Bug,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Printer,
  X,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  Upload,
  User,
  Phone,
  Mail,
  Receipt,
  Sparkles,
  Settings,
  Lock,
  Eye,
  EyeOff,
  AtSign,
  KeyRound,
  ShieldCheck,
  Loader2,
  Edit3,
  RotateCw,
  Star,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { orderApi, walletApi, authApi, bugApi, reviewApi } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PaymentModal from '../../components/payment/PaymentModal';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;

const ProfilePage = () => {
  const { user, updateProfile, changePassword, forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'wallet' | 'orders' | 'addresses' | 'bugs'
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Settings tab states
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneState, setPhoneState] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Reset password in-page wizard states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Send, 2: Code, 3: New Pass
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const resetOtpRefs = useRef([]);

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isRealPaymentOpen, setIsRealPaymentOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('100000');
  const [topUpMethod, setTopUpMethod] = useState('card');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState(null);

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ title: '', address: '', phone: '', isDefault: false });

  const [bugForm, setBugForm] = useState({ title: '', description: '', screenshot: '' });
  const [bugLoading, setBugLoading] = useState(false);

  // Review & Rating Modal State (for delivered orders)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverStar, setReviewHoverStar] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Check URL query parameters for auto-opening review modal (?tab=reviews&orderId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const orderIdParam = params.get('orderId');

    if (tabParam === 'reviews' || orderIdParam) {
      setActiveTab('orders');
      if (orderIdParam && orders.length > 0) {
        const target = orders.find((o) => o.orderId === orderIdParam || o._id === orderIdParam);
        if (target && target.status === 'delivered') {
          handleOpenReviewModal(target);
        }
      }
    }
  }, [orders]);

  // Synchronize user prop when it updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPhoneState(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Cooldown timer for reset password modal
  useEffect(() => {
    let timer;
    if (resetCooldown > 0) {
      timer = setInterval(() => setResetCooldown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Real-time username check for settings
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }

    const clean = username.replace(/^@/, '').toLowerCase().trim();
    if (clean.length < 4) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Kamida 4 ta belgi bo‘lishi shart',
      });
      return;
    }

    if (!USERNAME_REGEX.test(clean)) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Faqat lotin harflari, raqamlar va pastki chiziq',
      });
      return;
    }

    setUsernameStatus({ state: 'checking', message: 'Tekshirilmoqda...' });
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(clean);
        if (res.data?.available) {
          setUsernameStatus({ state: 'valid', message: `@${clean} bo‘sh va mavjud!` });
        } else {
          setUsernameStatus({
            state: 'invalid',
            message: res.data?.error || 'Ushbu username band',
          });
        }
      } catch (err) {
        setUsernameStatus({ state: 'idle', message: '' });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username, user?.username]);

  // Load Tab Data
  useEffect(() => {
    if (!user) return;
    loadTabData();
  }, [activeTab, user]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'wallet') {
        const res = await walletApi.getTransactions();
        setTransactions(res.data?.transactions || []);
      } else if (activeTab === 'orders') {
        const res = await orderApi.getUserOrders();
        setOrders(res.data?.orders || []);
      } else if (activeTab === 'addresses') {
        const res = await authApi.getAddresses();
        setAddresses(res.data?.addresses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Handle Save Profile Settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ismni kiritish shart.');
      return;
    }

    if (usernameStatus.state === 'invalid') {
      toast.error(usernameStatus.message || 'Username noto‘g‘ri kiritilgan.');
      return;
    }

    setProfileSaving(true);
    try {
      const cleanUsername = username ? username.replace(/^@/, '').toLowerCase().trim() : '';
      await updateProfile({
        name: name.trim(),
        username: cleanUsername || undefined,
        phone: phoneState.trim(),
        avatar: avatar.trim(),
      });
      toast.success('Profil muvaffaqiyatli saqlandi!');
      setUsernameStatus({ state: 'idle', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Profilni saqlashda xatolik yuz berdi.');
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Barcha parol maydonlarini to‘ldiring.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yangi parol va tasdiqlovchi parol bir-biriga mos kelmadi.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Yangi parol kamida 6 ta belgidan iborat bo‘lishi lozim.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Parolingiz muvaffaqiyatli yangilandi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Eski parol noto‘g‘ri kiritildi.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // 3. In-page Forgot Password Trigger
  const handleOpenResetModal = async () => {
    setIsResetModalOpen(true);
    setResetStep(1);
    setResetOtp(['', '', '', '', '', '']);
    setResetNewPass('');
    setResetConfirmPass('');
    
    // Automatically trigger code dispatch to current user email
    if (user?.email) {
      setResetLoading(true);
      try {
        await forgotPassword(user.email);
        setResetStep(2);
        setResetCooldown(60);
        toast.info('Tasdiqlash kodi emailingizga yuborildi.');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Xatolik yuz berdi.');
      } finally {
        setResetLoading(false);
      }
    }
  };

  const handleResetOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newArr = [...resetOtp];
        for (let i = 0; i < 6; i++) newArr[i] = pasted[i] || '';
        setResetOtp(newArr);
        const lastIdx = Math.min(pasted.length - 1, 5);
        resetOtpRefs.current[lastIdx]?.focus();
      }
      return;
    }

    const newArr = [...resetOtp];
    newArr[index] = value.slice(-1);
    setResetOtp(newArr);

    if (value && index < 5) {
      resetOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleResetOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetOtp[index] && index > 0) {
      resetOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    const code = resetOtp.join('');
    if (code.length < 6) {
      toast.error('6 xonali kodni to‘liq kiriting.');
      return;
    }

    setResetLoading(true);
    try {
      await verifyResetCode(user.email, code);
      setResetStep(3);
      toast.success('Kod tasdiqlandi. Yangi parolingizni belgilang.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Tasdiqlash kodi noto‘g‘ri.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    if (resetNewPass !== resetConfirmPass) {
      toast.error('Yangi parol va tasdiqlovchi parol bir xil emas.');
      return;
    }
    if (resetNewPass.length < 6) {
      toast.error('Parol kamida 6 ta belgidan iborat bo‘lishi lozim.');
      return;
    }

    setResetLoading(true);
    try {
      const code = resetOtp.join('');
      await resetPassword(user.email, code, resetNewPass, resetConfirmPass);
      toast.success('Parolingiz muvaffaqiyatli yangilandi!');
      setIsResetModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Parolni yangilashda xatolik yuz berdi.');
    } finally {
      setResetLoading(false);
    }
  };

  // Top-Up Wallet (Real Payment: Card, Payme, Click)
  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount < 10000) {
      toast.error('Minimal to‘ldirish summasi: 10,000 so‘m');
      return;
    }
    setIsTopUpModalOpen(false);
    setIsRealPaymentOpen(true);
  };

  // Add Address
  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.addAddress(addressForm);
      setAddresses(res.data?.addresses || []);
      setIsAddAddressModalOpen(false);
      setAddressForm({ title: '', address: '', phone: '', isDefault: false });
      toast.success('Manzil muvaffaqiyatli saqlandi!');
    } catch (err) {
      toast.error('Manzilni saqlashda xatolik.');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    try {
      const res = await authApi.deleteAddress(id);
      setAddresses(res.data?.addresses || []);
      toast.info('Manzil o‘chirildi.');
    } catch (err) {
      toast.error('O‘chirishda xatolik.');
    }
  };

  // Submit Bug Report
  const handleBugSubmit = async (e) => {
    e.preventDefault();
    if (!bugForm.title || !bugForm.description) {
      toast.error('Xatolik mavzusi va tavsifini kiriting.');
      return;
    }

    setBugLoading(true);
    try {
      await bugApi.create({
        title: bugForm.title,
        description: bugForm.description,
        screenshot: bugForm.screenshot,
      });
      toast.success('Xatolik haqidagi xabaringiz qabul qilindi!', 'Mutaxassislarimiz tez orada tekshirib chiqishadi.');
      setBugForm({ title: '', description: '', screenshot: '' });
    } catch (err) {
      toast.error('Xabarni yuborishda xatolik.');
    } finally {
      setBugLoading(false);
    }
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBugForm((p) => ({ ...p, screenshot: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleOpenReviewModal = (order) => {
    setReviewOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setReviewPhoto('');
    setIsReviewModalOpen(true);
  };

  const handleReviewPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm faylini tanlang (JPG, PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan kichik bo‘lishi kerak.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReviewPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Fikringizni qisqacha yozib qoldiring.');
      return;
    }

    try {
      setReviewLoading(true);
      const firstCake = reviewOrder?.items?.[0];
      await reviewApi.create({
        rating: reviewRating,
        comment: reviewComment.trim(),
        photo: reviewPhoto || '',
        cakeId: firstCake?.cake || '',
        cakeName: firstCake?.name || 'Bol Tortlari',
        orderId: reviewOrder?.orderId || '',
      });
      toast.success('Fikr va bahoingiz qabul qilindi!', 'Xizmatimizni baholaganingiz uchun samimiy tashakkur!');
      setIsReviewModalOpen(false);
      setReviewOrder(null);
      setReviewComment('');
      setReviewPhoto('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sharh qoldirishda xatolik yuz berdi.');
    } finally {
      setReviewLoading(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success" dot>Yetkazildi</Badge>;
      case 'delivering':
        return <Badge variant="primary" dot>Yetkazilmoqda</Badge>;
      case 'preparing':
        return <Badge variant="warning" dot>Pishirilmoqda</Badge>;
      case 'ready':
        return <Badge variant="secondary" dot>Tayyor</Badge>;
      case 'confirmed':
        return <Badge variant="primary" dot>Tasdiqlandi</Badge>;
      case 'cancelled':
        return <Badge variant="danger" dot>Bekor qilindi</Badge>;
      default:
        return <Badge variant="neutral" dot>Kutilmoqda</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0F1012]">
        <p className="text-sm text-[#6B7280]">Iltimos, avval tizimga kiring.</p>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-screen bg-[#FBFBFC] dark:bg-[#0F1012] text-[#111827] dark:text-[#F3F4F6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Banner */}
        <div className="bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl p-6 sm:p-8 shadow-subtle mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Brand Avatar */}
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] border border-[#BFDBFE]/60 dark:border-[#1E3A8A] flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-subtle overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={user.name}>
                    {user.name}
                  </h1>
                  {user.username ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
                      @{user.username}
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> @username o‘rnating
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2563EB]" /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#2563EB]" /> {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Balance Header Pill */}
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 border border-[#BFDBFE]/60 dark:border-[#1E3A8A]">
                <div className="text-[10px] uppercase font-bold text-[#2563EB] dark:text-[#93C5FD]">
                  {t('profile.wallet_balance', 'Hamyon balansi')}
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F3F4F6]">
                  {(user.walletBalance || 0).toLocaleString()} {t('common.currency', 'so‘m')}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsTopUpModalOpen(true)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-subtle cursor-pointer"
              >
                {t('profile.top_up', 'To‘ldirish')}
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[#26282E] overflow-x-auto no-scrollbar">
            {[
              { id: 'settings', label: t('profile.tab_settings', 'Sozlamalar'), icon: Settings },
              { id: 'wallet', label: t('profile.tab_wallet', 'Hamyon & Keshbek'), icon: Wallet },
              { id: 'orders', label: t('profile.tab_orders', 'Mening buyurtmalarim'), icon: ShoppingBag, count: orders.length },
              { id: 'addresses', label: t('profile.tab_addresses', 'Manzillarim'), icon: MapPin },
              { id: 'bugs', label: t('profile.tab_bugs', 'Xatolik haqida xabar'), icon: Bug },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-subtle'
                      : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#E5E7EB] dark:bg-[#2A2D35] text-[#4B5563]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: SETTINGS (SHAXSIY MA'LUMOTLAR & PAROL O'ZGARTIRISH)   */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CARD 1: Shaxsiy ma'lumotlar */}
            <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F5EDE2] dark:border-[#24272D]">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1917] dark:text-white">
                    {t('profile.title_settings', 'Profil ma‘lumotlari')}
                  </h3>
                  <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                    {t('profile.subtitle_settings', 'Shaxsiy ma‘lumotlaringiz va parolingizni boshqaring')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Preview & Initials */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFBEB]/60 dark:bg-[#1C1917]/50 border border-[#FDE68A]/60 dark:border-[#382E1E]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center font-bold text-xl shadow-md overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#1C1917] dark:text-white block mb-1">
                      Avatar rasmi URL (ixtiyoriy)
                    </label>
                    <input
                      type="url"
                      placeholder="https://misol.uz/rasm.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-xs outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                    {t('profile.name_label', 'To‘liq ism')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
                  />
                </div>

                {/* Telegram-style Username field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1]">
                      {t('profile.username_label', 'Foydalanuvchi nomi')}
                    </label>
                    {usernameStatus.state === 'valid' && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {usernameStatus.message}
                      </span>
                    )}
                    {usernameStatus.state === 'invalid' && (
                      <span className="text-[11px] text-rose-500 font-medium">
                        {usernameStatus.message}
                      </span>
                    )}
                    {usernameStatus.state === 'checking' && (
                      <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Tekshirilmoqda...
                      </span>
                    )}
                  </div>
                  <div className="relative flex rounded-xl shadow-xs">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#E7E5E4] dark:border-[#2E3138] bg-[#F5EDE2] dark:bg-[#1E2024] text-[#78716C] text-sm font-bold select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="noyob_username"
                      className={`w-full px-3.5 py-2.5 bg-white dark:bg-[#0F1012] border rounded-r-xl text-sm outline-none transition-all ${
                        usernameStatus.state === 'valid'
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          : usernameStatus.state === 'invalid'
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                          : 'border-[#E7E5E4] dark:border-[#2E3138] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[#A8A29E] mt-1">
                    Kamida 4 ta belgi, faqat lotin harflari, raqamlar va pastki chiziq (`_`).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                    Email manzil (o‘zgarmas hisob identifikatori)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-2.5 bg-[#F5EDE2]/50 dark:bg-[#181A1F] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm text-[#78716C] outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                    {t('profile.phone_label', 'Telefon raqami')}
                  </label>
                  <input
                    type="tel"
                    value={phoneState}
                    onChange={(e) => setPhoneState(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-2.5 mt-2 bg-[#D97706] hover:bg-[#B45309] text-white shadow-md font-medium cursor-pointer"
                >
                  {profileSaving ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </div>
                  ) : (
                    t('profile.save_btn', 'O‘zgarishlarni saqlash')
                  )}
                </Button>
              </form>
            </div>

            {/* CARD 2: Xavfsizlik va Parolni o'zgartirish */}
            <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F5EDE2] dark:border-[#24272D]">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1C1917] dark:text-white">
                      {t('profile.password_card_title', 'Parolni yangilash')}
                    </h3>
                    <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                      Hisob parolini yangilash yoki qayta tiklash
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                      1-maydon: Eski parol
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Amaldagi parolingiz"
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                      2-maydon: Yangi parol (kamida 6 ta belgi)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kamida 6 ta belgi"
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44403C] dark:text-[#D6D3D1] block mb-1">
                      3-maydon: Yangi parolni tasdiqlang
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Yangi parolni qaytadan kiriting"
                        className={`w-full pl-4 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border rounded-xl text-sm outline-none transition-all ${
                          confirmPassword && newPassword === confirmPassword
                            ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            : confirmPassword
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                            : 'border-[#E7E5E4] dark:border-[#2E3138] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Prominent "Parolingiz esingizdan chiqdimi?" Link */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleOpenResetModal}
                      className="text-xs text-[#D97706] dark:text-[#F59E0B] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Parolingiz esingizdan chiqdimi?</span>
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full py-2.5 mt-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white shadow-md font-medium cursor-pointer"
                  >
                    {passwordSaving ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Yangilanmoqda...</span>
                      </div>
                    ) : (
                      'Parolni yangilash'
                    )}
                  </Button>
                </form>
              </div>

              {/* Security Hint */}
              <div className="mt-6 p-3.5 rounded-2xl bg-[#FFFBEB]/60 dark:bg-[#1C1917]/50 border border-[#FDE68A]/60 dark:border-[#382E1E] text-xs text-[#78716C] dark:text-[#A8A29E] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#D97706] shrink-0" />
                <span>
                  Parolingizni vaqt-vaqti bilan yangilab turish profilingiz xavfsizligini ta'minlaydi.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: WALLET & CASHBACK                                     */}
        {/* ============================================================ */}
        {activeTab === 'wallet' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-[#1C1917] to-[#292524] text-white border-0 shadow-lg">
                <span className="text-xs uppercase font-bold text-[#FDE68A] block mb-1">
                  Mening Balansim
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mb-4">
                  {(user.walletBalance || 0).toLocaleString()} so‘m
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white text-xs border-0"
                  >
                    Hisobni to‘ldirish
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#78716C] dark:text-[#A8A29E]">Keshbek darajasi</div>
                    <div className="text-xl font-bold text-[#1C1917] dark:text-white">Doimiy 3%</div>
                  </div>
                </div>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-3">
                  Har bir yetkazilgan buyurtmangizdan 3% mablag‘ avtomatik hamyoningizga qaytariladi.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#78716C] dark:text-[#A8A29E]">Jami buyurtmalar</div>
                    <div className="text-xl font-bold text-[#1C1917] dark:text-white">{orders.length} ta</div>
                  </div>
                </div>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-3">
                  Xaridlaringiz uchun hamyon orqali 1-klikda to‘lov amalga oshirishingiz mumkin.
                </p>
              </Card>
            </div>

            {/* Transactions History */}
            <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold mb-4">Hamyon harakatlari tarixi</h3>
              {transactions.length === 0 ? (
                <p className="text-xs text-[#78716C] text-center py-8">Tranzaksiyalar mavjud emas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EFE4D6] dark:border-[#272A30] text-[#78716C]">
                        <th className="pb-3 font-semibold">Turi</th>
                        <th className="pb-3 font-semibold">Sabab</th>
                        <th className="pb-3 font-semibold">Sana</th>
                        <th className="pb-3 font-semibold text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EDE2] dark:divide-[#24272D]">
                      {transactions.map((tx) => (
                        <tr key={tx._id || tx.id}>
                          <td className="py-3">
                            <span className="font-semibold capitalize">{tx.type}</span>
                          </td>
                          <td className="py-3 text-[#78716C]">{tx.reason}</td>
                          <td className="py-3 text-[#A8A29E]">
                            {new Date(tx.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 text-right font-bold text-[#D97706]">
                            +{tx.amount.toLocaleString()} so‘m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ORDERS                                                */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold mb-6">Mening buyurtmalarim</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-[#A8A29E] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#78716C]">Sizda hali buyurtmalar yo‘q.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord._id || ord.id}
                    className="p-4 rounded-2xl border border-[#EFE4D6] dark:border-[#272A30] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">#{ord.orderId}</span>
                        {getOrderStatusBadge(ord.status)}
                      </div>
                      <p className="text-xs text-[#78716C]">
                        {new Date(ord.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-sm text-[#D97706]">
                        {ord.total.toLocaleString()} so‘m
                      </span>
                      {ord.status === 'delivered' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReviewModal(ord)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex items-center gap-1.5 cursor-pointer shadow-xs font-semibold px-3 py-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> Baholash
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrderReceipt(ord)}
                        className="text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Chek
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ADDRESSES                                             */}
        {/* ============================================================ */}
        {activeTab === 'addresses' && (
          <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">Saqlangan manzillar</h3>
              <Button size="sm" onClick={() => setIsAddAddressModalOpen(true)} className="bg-[#D97706] text-white">
                <Plus className="w-4 h-4 mr-1" /> Yangi manzil
              </Button>
            </div>

            {addresses.length === 0 ? (
              <p className="text-xs text-[#78716C] text-center py-8">Manzillar saqlanmagan.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 rounded-2xl border border-[#EFE4D6] dark:border-[#272A30] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{addr.title}</span>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#78716C]">{addr.address}</p>
                    {addr.phone && <p className="text-xs text-[#A8A29E] mt-1">{addr.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: BUGS REPORT                                           */}
        {/* ============================================================ */}
        {activeTab === 'bugs' && (
          <div className="bg-white/80 dark:bg-[#16181D]/85 backdrop-blur-md border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl">
            <h3 className="text-base font-bold mb-2">Xatolik yoki nosozlik haqida xabar</h3>
            <p className="text-xs text-[#78716C] mb-6">
              Platformada biron muammo sezsangiz, iltimos bizga xabar bering. Biz darhol bartaraf etamiz.
            </p>

            <form onSubmit={handleBugSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Mavzu</label>
                <input
                  type="text"
                  required
                  placeholder="Muammo nima haqida?"
                  value={bugForm.title}
                  onChange={(e) => setBugForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Batafsil tavsif</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Xatolik qanday sodir bo‘ldi?"
                  value={bugForm.description}
                  onChange={(e) => setBugForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E5E4] dark:border-[#2E3138] rounded-xl text-sm outline-none focus:border-[#D97706]"
                />
              </div>

              <Button type="submit" disabled={bugLoading} className="w-full py-2.5 bg-[#D97706] text-white">
                {bugLoading ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
              </Button>
            </form>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* IN-PAGE PASSWORD RESET WIZARD MODAL                          */}
      {/* ============================================================ */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsResetModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-4 right-4 text-[#78716C] p-1">
              <X className="w-5 h-5" />
            </button>

            {resetStep === 2 && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-4 text-center">
                <div className="w-12 h-12 bg-amber-50 text-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold">Emailga yuborilgan kodni kiriting</h3>
                <p className="text-xs text-[#78716C]"><strong>{user.email}</strong> pochtangizga 6 xonali kod yuborildi.</p>

                <div className="flex justify-center gap-2 my-3">
                  {resetOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (resetOtpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleResetOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleResetOtpKeyDown(idx, e)}
                      className="w-10 h-12 text-center text-lg font-bold border-2 rounded-xl focus:border-[#D97706] outline-none"
                    />
                  ))}
                </div>

                <Button type="submit" disabled={resetLoading || resetOtp.join('').length < 6} className="w-full bg-[#D97706] text-white">
                  {resetLoading ? 'Tekshirilmoqda...' : 'Kodni tasdiqlash'}
                </Button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <h3 className="text-base font-bold text-center">Yangi parol belgilang</h3>
                <div>
                  <label className="text-xs font-semibold block mb-1">Yangi parol (kamida 6 ta belgi)</label>
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Yangi parolni tasdiqlang</label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPass}
                    onChange={(e) => setResetConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-[#D97706]"
                  />
                </div>
                <Button type="submit" disabled={resetLoading} className="w-full bg-[#D97706] text-white">
                  {resetLoading ? 'Yangilanmoqda...' : 'Parolni saqlash'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Top-up Wallet Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsTopUpModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl p-6 z-10">
            <button onClick={() => setIsTopUpModalOpen(false)} className="absolute top-4 right-4 text-[#78716C] p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold mb-4">Hamyonni to‘ldirish</h3>
            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Summa (so‘m)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-[#D97706]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'card', label: 'Karta', sub: 'Uzcard/Humo' },
                  { id: 'payme', label: 'Payme', sub: 'Onlayn' },
                  { id: 'click', label: 'Click', sub: 'Onlayn' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTopUpMethod(m.id)}
                    className={`p-2 rounded-xl text-center border cursor-pointer transition-all ${
                      topUpMethod === m.id
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 text-[#2563EB] font-bold shadow-xs'
                        : 'border-stone-200 dark:border-stone-700/80 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[9px] opacity-75 font-normal">{m.sub}</div>
                  </button>
                ))}
              </div>
              <Button type="submit" className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold">
                To‘lov sahifasiga o‘tish
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAddAddressModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#16181D] border rounded-2xl p-6 z-10">
            <button onClick={() => setIsAddAddressModalOpen(false)} className="absolute top-4 right-4 text-[#78716C] p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold mb-4">Yangi manzil qo‘shish</h3>
            <form onSubmit={handleAddAddressSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Manzil nomi (Uy, Ishxona...)"
                value={addressForm.title}
                onChange={(e) => setAddressForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2 border rounded-xl text-xs"
              />
              <textarea
                required
                rows={3}
                placeholder="Shahar, ko‘cha, xonadon raqami"
                value={addressForm.address}
                onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full px-3.5 py-2 border rounded-xl text-xs"
              />
              <input
                type="tel"
                placeholder="Aloqa telefoni"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3.5 py-2 border rounded-xl text-xs"
              />
              <Button type="submit" className="w-full bg-[#D97706] text-white">
                Saqlash
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedOrderReceipt(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#16181D] border rounded-2xl p-6 z-10 text-xs">
            <button onClick={() => setSelectedOrderReceipt(null)} className="absolute top-4 right-4 p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-center mb-1">Bol Tortlari Kvitansiyasi</h3>
            <p className="text-center text-[#78716C] mb-4">Buyurtma #{selectedOrderReceipt.orderId}</p>
            <div className="border-t border-b py-3 space-y-2">
              <div className="flex justify-between font-bold">
                <span>Jami to‘lov:</span>
                <span>{selectedOrderReceipt.total.toLocaleString()} so‘m</span>
              </div>
            </div>
            <Button onClick={() => window.print()} className="w-full mt-4 bg-[#D97706] text-white">
              <Printer className="w-4 h-4 mr-2" /> Chop etish
            </Button>
          </div>
        </div>
      )}

      {/* Review & Rating Modal */}
      {isReviewModalOpen && reviewOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !reviewLoading && setIsReviewModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#16181D] border border-[#EFE4D6] dark:border-[#272A30] rounded-3xl p-6 sm:p-7 z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => !reviewLoading && setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-stone-200 dark:border-stone-800">
              <span className="inline-block p-2.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 mb-2">
                <Star className="w-6 h-6 fill-current" />
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Buyurtmangizni Baholang
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Buyurtma #{reviewOrder.orderId} • {reviewOrder.items?.[0]?.name || 'Tort'}
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
              {/* Star Rating selector */}
              <div className="text-center">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300 block mb-2">
                  Bahoingizni belgilang (1 dan 5 yulduzgacha):
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (reviewHoverStar || reviewRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setReviewHoverStar(star)}
                        onMouseLeave={() => setReviewHoverStar(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {reviewRating === 5
                    ? 'Ajoyib! Juda yoqdi (5/5)'
                    : reviewRating === 4
                    ? 'Yaxshi (4/5)'
                    : reviewRating === 3
                    ? 'Qoniqarli (3/5)'
                    : reviewRating === 2
                    ? 'Kamchiliklar bor (2/5)'
                    : 'Qoniqarsiz (1/5)'}
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Fikringiz va sharhingiz *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tort ta'mi, yetkazib berish xizmati va qandolat bezagi haqida samimiy fikringizni yozing..."
                  className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 leading-relaxed outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Photo / Camera upload */}
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Tort rasmini qo‘shish (Ixtiyoriy)
                </label>
                {reviewPhoto ? (
                  <div className="relative p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3">
                    <img
                      src={reviewPhoto}
                      alt="Tort rasmi"
                      className="w-16 h-16 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Rasm biriktirildi
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewPhoto('')}
                        className="text-[11px] text-red-500 hover:underline mt-1 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Rasmni o‘chirish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Direct Camera Button */}
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:border-amber-500 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer transition-colors btn-press">
                      <Camera className="w-4 h-4 text-amber-500" />
                      <span>Rasmga olish</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleReviewPhotoSelect}
                        className="hidden"
                      />
                    </label>

                    {/* Gallery Upload Button */}
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:border-amber-500 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer transition-colors btn-press">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span>Galereyadan</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewPhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                loading={reviewLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl shadow-md cursor-pointer btn-press"
              >
                Sharhni yuborish
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Real Payment Modal for Wallet Top-Up */}
      <PaymentModal
        isOpen={isRealPaymentOpen}
        onClose={() => setIsRealPaymentOpen(false)}
        amount={Number(topUpAmount) || 50000}
        isWalletTopUp={true}
        onSuccess={(res) => {
          toast.success(res.message || 'Hisobingiz muvaffaqiyatli to‘ldirildi!');
          if (res.newBalance !== undefined && user) {
            user.walletBalance = res.newBalance;
          }
          loadOrdersAndWallet();
        }}
      />

    </div>
  );
};

export default ProfilePage;
