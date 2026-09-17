import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  KeyRound,
  RotateCw,
  Eye,
  EyeOff,
  AtSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import Button from '../common/Button';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;

const AuthModal = ({ isOpen, onClose }) => {
  const {
    login,
    register,
    verifyEmail,
    resendCode,
    forgotPassword,
    verifyResetCode,
    resetPassword,
  } = useAuth();
  const { toast } = useToast();

  // Modes: 'login' | 'register' | 'verify_email' | 'forgot_step_1' | 'forgot_step_2' | 'forgot_step_3'
  const [mode, setMode] = useState('login');

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' }); // 'idle' | 'checking' | 'valid' | 'invalid'
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP / Verification states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Forgot password wizard states
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Real-time username debounce check
  useEffect(() => {
    if (!username) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }

    const clean = username.replace(/^@/, '').toLowerCase().trim();
    if (clean.length < 4) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Kamida 4 ta belgi bo‘lishi lozim',
      });
      return;
    }

    if (!USERNAME_REGEX.test(clean)) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Faqat lotin harflari, raqamlar va _ ruxsat etilgan',
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
  }, [username]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const clearOtp = () => {
    setOtpDigits(['', '', '', '', '', '']);
  };

  const getOtpValue = () => otpDigits.join('');

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of whole code
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newArr = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newArr[i] = pasted[i] || '';
        }
        setOtpDigits(newArr);
        const lastIdx = Math.min(pasted.length - 1, 5);
        otpRefs.current[lastIdx]?.focus();
      }
      return;
    }

    const newArr = [...otpDigits];
    newArr[index] = value.slice(-1);
    setOtpDigits(newArr);

    // Auto advance focus
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await login(loginIdentifier, password);
      toast.success('Tizimga muvaffaqiyatli kirdingiz!', 'Xush kelibsiz!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        setMode('verify_email');
        setResendCooldown(60);
        setError('Hisobingiz tasdiqlanmagan. Emailingizga yangi tasdiqlash kodi yuborildi.');
      } else {
        const msg = data?.error || 'Email/Username yoki parol noto‘g‘ri.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (regPassword !== confirmPassword) {
      const msg = 'Kiritilgan parollar bir-biriga mos kelmadi.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (usernameStatus.state === 'invalid') {
      const msg = usernameStatus.message || 'Username noto‘g‘ri kiritilgan.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        username: username.replace(/^@/, '').toLowerCase().trim() || undefined,
        email: regEmail.trim(),
        phone: phone.trim(),
        password: regPassword,
      });

      setMode('verify_email');
      setResendCooldown(60);
      clearOtp();
      toast.success('Ro‘yxatdan o‘tildi!', 'Emailingizga 6 xonali tasdiqlash kodi yuborildi.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://cakeshop-backend-fs9q.onrender.com/api';
    window.location.href = `${backendUrl}/auth/google`;
  };

  // 3. Handle Verify Email
  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    const code = getOtpValue();
    if (code.length < 6) {
      setError('Iltimos, 6 xonali tasdiqlash kodini to‘liq kiriting.');
      return;
    }

    setLoading(true);
    try {
      const emailToVerify = regEmail || loginIdentifier;
      await verifyEmail(emailToVerify, code);
      toast.success('Hisobingiz faollashtirildi!', 'Endi bemalol xarid qilishingiz mumkin.');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Tasdiqlash kodi noto‘g‘ri yoki muddati o‘tgan.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Resend Code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    resetMessages();
    setLoading(true);

    try {
      const targetEmail = mode === 'verify_email' ? regEmail || loginIdentifier : forgotEmail;
      await resendCode(targetEmail);
      setResendCooldown(60);
      toast.info('Yangi tasdiqlash kodi yuborildi.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kodni qayta yuborishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Forgot Password Wizard - Step 1: Send Code
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!forgotEmail) {
      setError('Email manzilini kiriting.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      clearOtp();
      setMode('forgot_step_2');
      setResendCooldown(60);
      toast.info('Tasdiqlash kodi emailingizga yuborildi.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Xatolik yuz berdi.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Wizard - Step 2: Verify Code
  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    resetMessages();
    const code = getOtpValue();
    if (code.length < 6) {
      setError('Iltimos, 6 xonali kodni to‘liq kiriting.');
      return;
    }

    setLoading(true);
    try {
      await verifyResetCode(forgotEmail, code);
      setMode('forgot_step_3');
      toast.success('Kod tasdiqlandi!', 'Endi yangi parolingizni belgilang.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Kiritilgan kod noto‘g‘ri yoki muddati tugagan.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 7. Forgot Password Wizard - Step 3: Set New Password
  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmNewPassword) {
      const msg = 'Yangi parol va tasdiqlovchi parol bir xil emas.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi shart.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const code = getOtpValue();
      await resetPassword(forgotEmail, code, newPassword, confirmNewPassword);
      toast.success('Parol muvaffaqiyatli yangilandi!', 'Yangi parol bilan tizimga kiring.');
      setMode('login');
      setLoginIdentifier(forgotEmail);
      setPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Parolni yangilashda xatolik yuz berdi.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Back Button (for sub-modes) */}
        {['verify_email', 'forgot_step_1', 'forgot_step_2', 'forgot_step_3'].includes(mode) && (
          <button
            onClick={() => {
              if (mode === 'forgot_step_2') setMode('forgot_step_1');
              else if (mode === 'forgot_step_3') setMode('forgot_step_2');
              else setMode('login');
              resetMessages();
            }}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#D97706] dark:hover:text-[#F59E0B] mb-4 cursor-pointer font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orqaga</span>
          </button>
        )}

        {/* TABS: LOGIN OR REGISTER */}
        {['login', 'register'].includes(mode) && (
          <div className="flex border-b border-[#E7E9ED] dark:border-[#272A30] mb-6">
            <button
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-[#D97706] text-[#D97706] dark:border-[#F59E0B] dark:text-[#F59E0B]'
                  : 'border-transparent text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6]'
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => {
                setMode('register');
                resetMessages();
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-[#D97706] text-[#D97706] dark:border-[#F59E0B] dark:text-[#F59E0B]'
                  : 'border-transparent text-[#6B7280] hover:text-[#17181A] dark:hover:text-[#F3F4F6]'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>
        )}

        {/* REAL-TIME ERROR NOTIFICATION BANNER */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. LOGIN FORM */}
        {/* ============================================================ */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5">
                Email yoki Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="info@example.com yoki telefon"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB]">
                  Parol
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                    setMode('forgot_step_1');
                    resetMessages();
                  }}
                  className="text-xs text-[#D97706] dark:text-[#F59E0B] hover:underline cursor-pointer font-medium"
                >
                  Parolni unutdingizmi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </div>
              ) : (
                'Tizimga kirish'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E9ED] dark:border-[#272A30]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#16181D] px-2 text-[#9CA3AF] font-medium text-[11px]">
                  yoki
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#1F2228] hover:bg-[#F9FAFB] dark:hover:bg-[#252830] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-xs sm:text-sm font-semibold text-[#374151] dark:text-[#F3F4F6] flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google orqali kirish</span>
            </button>
          </form>
        )}

        {/* ============================================================ */}
        {/* 2. REGISTER FORM */}
        {/* ============================================================ */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1">
                Ism va familiya
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Sardor Rahimiy"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Telegram-style Username field with real-time feedback */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB]">
                  Username (Telegram uslubida)
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
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E7E9ED] dark:border-[#272A30] bg-[#F7F8FA] dark:bg-[#1C1F26] text-[#9CA3AF] text-sm font-semibold select-none">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username_99"
                  className={`w-full px-3 py-2 bg-white dark:bg-[#0F1012] border rounded-r-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[#9CA3AF] ${
                    usernameStatus.state === 'valid'
                      ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : usernameStatus.state === 'invalid'
                      ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20'
                      : 'border-[#E7E9ED] dark:border-[#272A30] focus:border-[#D97706] focus:ring-[#D97706]/20'
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Kamida 4 ta belgi, faqat lotin harflari, raqamlar va pastki chiziq.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="misol@gmail.com"
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                  />
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1">
                Parol (kamida 6 ta belgi)
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-white cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1">
                Parolni tasdiqlang
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-[#0F1012] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[#9CA3AF] ${
                    confirmPassword && regPassword === confirmPassword
                      ? 'border-emerald-500 focus:ring-emerald-500/20'
                      : confirmPassword
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-[#E7E9ED] dark:border-[#272A30] focus:border-[#D97706] focus:ring-[#D97706]/20'
                  }`}
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                {confirmPassword && regPassword === confirmPassword && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-3 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Hisob yaratilmoqda...</span>
                </div>
              ) : (
                'Ro‘yxatdan o‘tish'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E9ED] dark:border-[#272A30]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#16181D] px-2 text-[#9CA3AF] font-medium text-[11px]">
                  yoki
                </span>
              </div>
            </div>

            {/* Google Register Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#1F2228] hover:bg-[#F9FAFB] dark:hover:bg-[#252830] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-xs sm:text-sm font-semibold text-[#374151] dark:text-[#F3F4F6] flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google orqali davom etish</span>
            </button>
          </form>
        )}

        {/* ============================================================ */}
        {/* 3. EMAIL ACTIVATION VERIFY OTP */}
        {/* ============================================================ */}
        {mode === 'verify_email' && (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-5 text-center">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-200 dark:border-amber-800">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Tasdiqlash kodini kiriting
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                <strong>{regEmail || loginIdentifier}</strong> pochtasiga 6 xonali tasdiqlash kodi yuborildi.
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 sm:gap-2.5 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white dark:bg-[#0F1012] border-2 border-[#E7E9ED] dark:border-[#272A30] rounded-xl focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all text-[#17181A] dark:text-[#F3F4F6]"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || getOtpValue().length < 6}
              className="w-full py-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </div>
              ) : (
                'Hisobni faollashtirish'
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResend}
                className="inline-flex items-center gap-1 text-xs text-[#D97706] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer font-medium"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `${resendCooldown}s dan keyin qayta yuborish` : 'Kodni qayta yuborish'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* 4. FORGOT PASSWORD WIZARD - STEP 1 */}
        {/* ============================================================ */}
        {mode === 'forgot_step_1' && (
          <form onSubmit={handleForgotStep1} className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="h-0.5 w-8 bg-[#E7E9ED] dark:bg-[#272A30]" />
              <span className="w-6 h-6 rounded-full bg-[#E7E9ED] dark:bg-[#272A30] text-[#9CA3AF] text-xs font-bold flex items-center justify-center">2</span>
              <span className="h-0.5 w-8 bg-[#E7E9ED] dark:bg-[#272A30]" />
              <span className="w-6 h-6 rounded-full bg-[#E7E9ED] dark:bg-[#272A30] text-[#9CA3AF] text-xs font-bold flex items-center justify-center">3</span>
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Parolni tiklash (1-qadam)
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                Ro‘yxatdan o‘tgan email manzilingizni kiriting.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5">
                Email manzil
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="misol@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </div>
              ) : (
                'Kodni yuborish'
              )}
            </Button>
          </form>
        )}

        {/* ============================================================ */}
        {/* 5. FORGOT PASSWORD WIZARD - STEP 2: OTP INPUT */}
        {/* ============================================================ */}
        {mode === 'forgot_step_2' && (
          <form onSubmit={handleForgotStep2} className="space-y-4 text-center">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">✓</span>
              <span className="h-0.5 w-8 bg-[#D97706]" />
              <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">2</span>
              <span className="h-0.5 w-8 bg-[#E7E9ED] dark:bg-[#272A30]" />
              <span className="w-6 h-6 rounded-full bg-[#E7E9ED] dark:bg-[#272A30] text-[#9CA3AF] text-xs font-bold flex items-center justify-center">3</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Tasdiqlash kodi (2-qadam)
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                <strong>{forgotEmail}</strong> ga yuborilgan 6 xonali kodni kiriting.
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 sm:gap-2.5 my-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white dark:bg-[#0F1012] border-2 border-[#E7E9ED] dark:border-[#272A30] rounded-xl focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all text-[#17181A] dark:text-[#F3F4F6]"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || getOtpValue().length < 6}
              className="w-full py-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </div>
              ) : (
                'Kodni tasdiqlash'
              )}
            </Button>

            <div className="pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResend}
                className="inline-flex items-center gap-1 text-xs text-[#D97706] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer font-medium"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `${resendCooldown}s dan keyin qayta yuborish` : 'Kodni qayta yuborish'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* 6. FORGOT PASSWORD WIZARD - STEP 3: NEW PASSWORD */}
        {/* ============================================================ */}
        {mode === 'forgot_step_3' && (
          <form onSubmit={handleForgotStep3} className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">✓</span>
              <span className="h-0.5 w-8 bg-emerald-600" />
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">✓</span>
              <span className="h-0.5 w-8 bg-[#D97706]" />
              <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">3</span>
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#17181A] dark:text-[#F3F4F6]">
                Yangi parol o‘rnating (3-qadam)
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                Yangi va xavfsiz parolingizni belgilang.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5">
                Yangi parol (kamida 6 ta belgi)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border border-[#E7E9ED] dark:border-[#272A30] rounded-xl text-sm focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all placeholder:text-[#9CA3AF]"
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#17181A] dark:hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] dark:text-[#D1D5DB] mb-1.5">
                Yangi parolni tasdiqlang
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0F1012] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[#9CA3AF] ${
                    confirmNewPassword && newPassword === confirmNewPassword
                      ? 'border-emerald-500 focus:ring-emerald-500/20'
                      : confirmNewPassword
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-[#E7E9ED] dark:border-[#272A30] focus:border-[#D97706] focus:ring-[#D97706]/20'
                  }`}
                />
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                {confirmNewPassword && newPassword === confirmNewPassword && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-medium shadow-md transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yangilanmoqda...</span>
                </div>
              ) : (
                'Parolni yangilash'
              )}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
