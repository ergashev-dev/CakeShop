import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import HomePage from './pages/Home/HomePage';
import CakesPage from './pages/Cakes/CakesPage';
import CakeDetailsPage from './pages/CakeDetails/CakeDetailsPage';
import CustomCakePage from './pages/CustomCake/CustomCakePage';
import ProfilePage from './pages/Profile/ProfilePage';
import OrdersPage from './pages/Orders/OrdersPage';
import FavoritesPage from './pages/Favorites/FavoritesPage';
import AdminPage from './pages/Admin/AdminPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import Footer from './components/footer/Footer';
import CartDrawer from './components/cart/CartDrawer';
import SearchModal from './components/common/SearchModal';
import AuthModal from './components/auth/AuthModal';
import TelegramLinkModal from './components/telegram/TelegramLinkModal';
import CookieConsentBanner from './components/common/CookieConsentBanner';
import PermissionsModal from './components/common/PermissionsModal';
import OfflineState from './components/states/OfflineState';
import SessionExpiredModal from './components/states/SessionExpiredModal';
import MaintenanceState from './components/states/MaintenanceState';
import MiraFloatingButton from './components/mira/MiraFloatingButton';
import MiraChatModal from './components/mira/MiraChatModal';
import miraApi from './services/mira/miraApi';
import { settingsApi, telegramApi } from './services/api';
import telegramWebApp from './services/telegramWebApp';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './utils/ScrollToTop';
import AdminRoute from './routes/AdminRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import socketClient from './services/socket';

function AppContent() {
  const { toast } = useToast();
  const { loginWithToken, user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isMiraOpen, setIsMiraOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const [miraSettings, setMiraSettings] = useState({
    isEnabled: true,
    websiteQuestions: true,
    productRecommendations: true,
    orderAssistance: true,
    voiceAssistant: true,
    generalAiQuestions: true,
    imageUnderstanding: true,
  });
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Initialize Telegram Mini Apps (TMA 2.0) & Auto-login
  useEffect(() => {
    telegramWebApp.init();

    if (telegramWebApp.isInsideTelegram() && !user) {
      const initData = telegramWebApp.getInitData();
      if (initData) {
        telegramApi
          .webappAuth(initData)
          .then((res) => {
            if (res.data?.token) {
              loginWithToken(res.data.token).catch(() => {});
            }
          })
          .catch(() => {});
      }
    }
  }, [user, loginWithToken]);

  // Load Store Settings & Mira AI Settings
  useEffect(() => {
    let mounted = true;
    settingsApi
      .get()
      .then((res) => {
        if (mounted && res.data?.settings) {
          setStoreSettings(res.data.settings);
        }
      })
      .catch(() => {});

    miraApi
      .getSettings()
      .then((settings) => {
        if (mounted && settings) {
          setMiraSettings(settings);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Handle Google OAuth / URL Auth Token callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const authError = params.get('error') || params.get('auth_error');

    if (authToken) {
      loginWithToken(authToken)
        .then((userData) => {
          toast.success(
            `Xush kelibsiz, ${userData?.name || 'foydalanuvchi'}!`,
            'Google orqali tizimga muvaffaqiyatli kirdingiz.'
          );
        })
        .catch(() => {
          toast.error('Kirishda xatolik yuz berdi', 'Iltimos, qaytadan urinib ko\'ring.');
        })
        .finally(() => {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    } else if (authError) {
      if (authError === 'google_not_configured') {
        toast.info(
          'Google OAuth sozlanmoqda',
          'Google Cloud Console orqali Client ID va Secret kalitlari ulanishi kerak.'
        );
      } else {
        toast.error('Kirishda xatolik', 'Google orqali kirish amalga oshmadi.');
      }
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [loginWithToken, toast]);

  // Realtime Delivery Celebration & Review Prompt
  useEffect(() => {
    const handleOrderDelivered = (data) => {
      toast.success(
        `🎉 #${data.orderId} raqamli buyurtmangiz yetkazildi!`,
        'Marhamat, shirinlik va xizmat sifatini baholab fikr qoldiring.'
      );
    };

    if (socketClient && typeof socketClient.on === 'function') {
      socketClient.on('order_delivered', handleOrderDelivered);
    }

    return () => {
      if (socketClient && typeof socketClient.off === 'function') {
        socketClient.off('order_delivered', handleOrderDelivered);
      }
    };
  }, [toast]);

  // Maintenance Mode Guard (Admins and Login/Admin routes are bypassed)
  const isMaintenanceActive = storeSettings?.maintenanceMode?.isEnabled;
  const isAdminUser = user && ['superadmin', 'super_admin', 'admin'].includes(user.role);
  const isBypassPath =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  if (isMaintenanceActive && !isAdminUser && !isBypassPath) {
    return <MaintenanceState maintenanceMode={storeSettings.maintenanceMode} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0F1012] text-[#17181A] dark:text-[#F3F4F6] transition-colors duration-200 flex flex-col selection:bg-[#2563EB] selection:text-white">
      <ScrollToTop />

      {/* Global Offline State Banner */}
      <OfflineState />

      {/* Global Session Expired Modal */}
      <SessionExpiredModal onLoginClick={() => setIsAuthOpen(true)} />

      {/* Global Navbar */}
      {!isAdminRoute && (
        <Navbar
          onSearchClick={() => setIsSearchOpen(true)}
          onAuthClick={() => setIsAuthOpen(true)}
          onTelegramClick={() => setIsTelegramOpen(true)}
        />
      )}

      {/* Page Routes */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cakes" element={<CakesPage />} />
          <Route path="/cakes/:id" element={<CakeDetailsPage />} />
          <Route path="/custom-cake" element={<CustomCakePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute allowedRoles={['superadmin', 'super_admin', 'admin', 'confectioner', 'courier']}>
                <AdminPage />
              </AdminRoute>
            }
          />
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Footer */}
      {!isAdminRoute && <Footer />}

      {/* Cart Drawer */}
      <CartDrawer onAuthRequired={() => setIsAuthOpen(true)} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Real Auth Modal (Login / Register / Nodemailer) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Telegram Linking Modal */}
      <TelegramLinkModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />

      {/* Permissions Onboarding Modal */}
      <PermissionsModal />

      {/* Mira AI Assistant (Customer-facing, hidden on /admin) */}
      {!isAdminRoute && miraSettings?.isEnabled !== false && (
        <>
          <MiraFloatingButton
            isOpen={isMiraOpen}
            onClick={() => setIsMiraOpen((prev) => !prev)}
          />
          <MiraChatModal
            isOpen={isMiraOpen}
            onClose={() => setIsMiraOpen(false)}
            aiSettings={miraSettings}
          />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
