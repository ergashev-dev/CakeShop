import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  Menu,
  X,
  Search,
  ShoppingBag,
  Cake,
  User,
  LogOut,
  LayoutDashboard,
  Wallet,
  Sparkles,
  ChefHat,
  Truck,
  Heart,
  Package,
  Send,
  Home,
  Tag,
  Percent,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import LanguageSelector from './LanguageSelector';
import NotificationCenter from '../notifications/NotificationCenter';

const Navbar = ({ onSearchClick, onAuthClick, onTelegramClick }) => {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { cartCount, cartSubtotal, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Desktop Navigation Links per design specifications:
  const navLinks = [
    { name: t('nav.cakes', 'Katalog'), to: '/cakes' },
    { name: t('nav.custom_cake', 'Maxsus tort'), to: '/custom-cake' },
    { name: t('nav.sales', 'Aksiyalar'), to: '/cakes?sale=true' },
    { name: t('nav.about', 'Biz haqimizda'), to: '/#story' },
  ];

  const isStaff = user && ['superadmin', 'super_admin', 'admin', 'confectioner', 'courier'].includes(user.role);

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#26282E] transition-shadow duration-200 ${
          isScrolled ? 'shadow-subtle' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LEFT: Logo & Desktop Navigation */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 select-none group">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]/60 dark:border-[#1E3A8A] transition-transform group-hover:scale-105">
                  <Cake className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base text-[#111827] dark:text-[#F3F4F6] leading-tight tracking-tight">
                    Bol Tortlari
                  </span>
                  <span className="text-[10px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                    {t('brand.tagline', 'Qandolatchilik ustaxonasi')}
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isHash = link.to.startsWith('/#');
                  const isActive = !isHash && (location.pathname + location.search === link.to || (link.to === '/cakes' && location.pathname === '/cakes' && !location.search));

                  if (isHash) {
                    return (
                      <a
                        key={link.to}
                        href={link.to.substring(1)}
                        className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] transition-colors"
                      >
                        {link.name}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-semibold'
                          : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* RIGHT: Actions: Search | Wishlist | Cart | Language | Dark mode | Account */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Search Button */}
              <button
                onClick={onSearchClick}
                className="p-2 text-[#4B5563] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors cursor-pointer"
                aria-label="Qidiruv"
                title="Qidiruv"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Wishlist Button (Tablet & Desktop; Mobile uses bottom bar & drawer) */}
              <Link
                to="/favorites"
                className="relative hidden sm:flex p-2 text-[#4B5563] hover:text-rose-500 dark:text-[#9CA3AF] dark:hover:text-rose-400 hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors cursor-pointer"
                aria-label="Sevimlilar"
                title="Sevimlilar"
              >
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 hover:bg-[#DBEAFE] dark:hover:bg-[#1E3A8A]/50 border border-[#BFDBFE]/60 dark:border-[#1E3A8A] rounded-xl text-xs font-semibold text-[#2563EB] dark:text-[#93C5FD] transition-colors cursor-pointer"
                aria-label={t('nav.cart', 'Savat')}
                title={t('nav.cart', 'Savat')}
              >
                <div className="relative flex items-center">
                  <ShoppingBag className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-bold">
                  {cartSubtotal > 0 ? `${cartSubtotal.toLocaleString()} ${t('common.currency', 'so‘m')}` : t('nav.cart', 'Savat')}
                </span>
              </button>

              {/* Notification Center (if logged in) */}
              {user && <NotificationCenter />}

              {/* Language Selector */}
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-[#4B5563] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors cursor-pointer"
                aria-label={t('common.dark_mode', 'Rejim')}
                title={t('common.dark_mode', 'Mavzu')}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-[#4B5563]" />
                )}
              </button>

              {/* Authentication / Profile Button */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#26282E] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white text-xs flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline truncate max-w-[90px]" title={user.name}>
                      {user.name}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#16181D] border border-[#E5E7EB] dark:border-[#26282E] rounded-2xl shadow-card p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 border-b border-[#E5E7EB] dark:border-[#26282E] mb-1">
                        <div className="font-semibold text-xs text-[#111827] dark:text-[#F3F4F6] truncate" title={user.name}>
                          {user.name}
                        </div>
                        <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate" title={user.email}>
                          {user.email}
                        </div>
                        <div className="text-[11px] font-bold text-[#2563EB] mt-1.5">
                          Hamyon: {(user.walletBalance || 0).toLocaleString()} {t('common.currency', 'so‘m')}
                        </div>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors"
                      >
                        <Package className="w-4 h-4 text-[#2563EB]" />
                        <span>{t('nav.orders', 'Buyurtmalarim')}</span>
                      </Link>

                      <Link
                        to="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span className="flex-1">{t('nav.favorites', 'Sevimlilar')}</span>
                        {wishlistCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228] rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                        <span>{t('nav.profile', 'Shaxsiy Kabinet')}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onTelegramClick && onTelegramClick();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0088cc] hover:bg-[#0088cc]/10 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{user.telegramId ? 'Telegram ulandi' : t('nav.connect_telegram', 'Telegramga ulash')}</span>
                        {user.telegramId ? (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                            Ulangan
                          </span>
                        ) : (
                          <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>

                      {isStaff && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/20 rounded-xl transition-colors mt-1 pt-1.5 border-t border-[#E5E7EB] dark:border-[#26282E]"
                        >
                          {user.role === 'confectioner' ? (
                            <ChefHat className="w-4 h-4" />
                          ) : user.role === 'courier' ? (
                            <Truck className="w-4 h-4" />
                          ) : (
                            <LayoutDashboard className="w-4 h-4" />
                          )}
                          <span>
                            {user.role === 'confectioner'
                              ? 'Oshxona Portali'
                              : user.role === 'courier'
                              ? 'Kuryer Portali'
                              : t('nav.admin', 'Boshqaruv Paneli')}
                          </span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.logout', 'Chiqish')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
                >
                  {t('nav.login', 'Kirish')}
                </button>
              )}

              {/* Mobile Hamburger Icon */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] dark:text-[#9CA3AF] rounded-xl cursor-pointer"
                aria-label="Menyu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#16181D] border-b border-[#E5E7EB] dark:border-[#26282E] px-4 pt-2 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2228]"
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#26282E] flex items-center justify-between px-3">
              <span className="text-xs text-[#6B7280]">Til / Язык / Lang:</span>
              <LanguageSelector variant="buttons" />
            </div>

            {user && (
              <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#26282E] space-y-1">
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F3F4F6]"
                >
                  <Package className="w-4 h-4 text-[#2563EB]" />
                  <span>{t('nav.orders', 'Buyurtmalarim')}</span>
                </Link>

                <Link
                  to="/favorites"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F3F4F6]"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>{t('nav.favorites', 'Sevimlilar')}</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onTelegramClick && onTelegramClick();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-[#0088cc] hover:bg-[#0088cc]/10 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>{user.telegramId ? 'Telegram ulandi' : t('nav.connect_telegram', 'Telegramga ulash')}</span>
                  </div>
                  {user.telegramId ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      Ulangan
                    </span>
                  ) : null}
                </button>

                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#2563EB]"
                  >
                    {t('nav.admin', 'Boshqaruv Paneli')} ({user.role})
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#26282E] px-2 py-1.5 flex items-center justify-around shadow-card safe-area-pb">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/'
              ? 'text-[#2563EB] font-bold'
              : 'text-[#6B7280] dark:text-[#9CA3AF]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('nav.home', 'Bosh sahifa')}</span>
        </Link>

        <Link
          to="/cakes"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/cakes' && !location.search.includes('sale=true')
              ? 'text-[#2563EB] font-bold'
              : 'text-[#6B7280] dark:text-[#9CA3AF]'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>{t('nav.cakes', 'Katalog')}</span>
        </Link>

        <Link
          to="/custom-cake"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/custom-cake'
              ? 'text-[#2563EB] font-bold'
              : 'text-[#6B7280] dark:text-[#9CA3AF]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('nav.custom_cake', 'Maxsus tort')}</span>
        </Link>

        <Link
          to="/favorites"
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/favorites'
              ? 'text-rose-500 font-bold'
              : 'text-[#6B7280] dark:text-[#9CA3AF]'
          }`}
        >
          <div className="relative">
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span>{t('nav.favorites', 'Sevimlilar')}</span>
        </Link>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium text-[#6B7280] dark:text-[#9CA3AF] cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>{t('nav.cart', 'Savat')}</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
