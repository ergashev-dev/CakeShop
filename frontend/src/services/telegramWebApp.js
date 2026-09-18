/**
 * Telegram Mini Apps (TMA 2.0) Service
 * Supports Fullscreen, Swipe-lock, Safe Area Insets, Haptics, Stars Invoice & Premium perks
 */

const getTg = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const telegramWebApp = {
  /**
   * Check if running inside Telegram Mini App
   */
  isInsideTelegram() {
    const tg = getTg();
    if (!tg) return false;
    if (tg.initData && tg.initData.length > 0) return true;
    if (tg.platform && tg.platform !== 'unknown') return true;
    if (typeof window !== 'undefined') {
      if (window.TelegramWebviewProxy || window.__telegram__init__) return true;
      if (window.location.hash.includes('tgWebAppData') || window.location.search.includes('tgWebAppData') || window.location.hash.includes('tgWebAppVersion')) return true;
    }
    return Boolean(tg.version);
  },

  /**
   * Initialize TMA 2.0: Fullscreen, swipe prevention, orientation lock & theme integration
   */
  init() {
    const tg = getTg();
    this.updateSafeAreaInsets();

    if (!tg) return;

    try {
      tg.ready();
      tg.expand();

      // 1. Fullscreen mode (Mini Apps 2.0 / Bot API 8.0+)
      const requestFs = () => {
        if (typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
          try {
            tg.requestFullscreen();
          } catch (e) {
            // fallback
          }
        }
      };

      requestFs();

      // Many mobile Telegram clients require a user gesture for fullscreen
      if (typeof document !== 'undefined') {
        document.addEventListener('touchstart', requestFs, { once: true, passive: true });
        document.addEventListener('click', requestFs, { once: true, passive: true });
      }

      // 2. Set native TMA header and background colors to dark premium
      if (typeof tg.setHeaderColor === 'function') {
        try { tg.setHeaderColor('#0F172A'); } catch (e) {}
      }
      if (typeof tg.setBackgroundColor === 'function') {
        try { tg.setBackgroundColor('#0F172A'); } catch (e) {}
      }

      // 3. Disable accidental vertical swipe down closure
      if (typeof tg.disableVerticalSwipes === 'function') {
        try {
          tg.disableVerticalSwipes();
        } catch (e) {}
      }

      // 4. Lock orientation to portrait
      if (typeof tg.lockOrientation === 'function') {
        try {
          tg.lockOrientation('portrait');
        } catch (e) {}
      }

      // 5. Setup Safe Area Insets into CSS root variables
      this.updateSafeAreaInsets();
      if (typeof tg.onEvent === 'function') {
        tg.onEvent('content_safe_area_changed', () => {
          this.updateSafeAreaInsets();
        });
        tg.onEvent('fullscreen_changed', () => {
          this.updateSafeAreaInsets();
        });
        tg.onEvent('safe_area_changed', () => {
          this.updateSafeAreaInsets();
        });
      }
    } catch (err) {
      console.warn('TMA init warning:', err);
    }
  },

  /**
   * Inject CSS variables for iPhone safe area notch & home indicator
   */
  updateSafeAreaInsets() {
    const tg = getTg();
    if (typeof document === 'undefined') return;

    const isInside = this.isInsideTelegram();
    const rawTop = tg?.contentSafeAreaInset?.top || tg?.safeAreaInset?.top || 0;
    const rawBottom = tg?.contentSafeAreaInset?.bottom || tg?.safeAreaInset?.bottom || 0;

    // In TMA, if top inset is 0 or low, guarantee at least 54px to clear phone status bar & Telegram's '✕ Yopish' header
    const topInset = isInside ? Math.max(rawTop, 54) : rawTop;
    const bottomInset = isInside ? Math.max(rawBottom, 12) : rawBottom;

    document.documentElement.style.setProperty('--tg-content-safe-area-top', `${topInset}px`);
    document.documentElement.style.setProperty('--tg-content-safe-area-bottom', `${bottomInset}px`);
    document.documentElement.style.setProperty('--tg-safe-area-top', `${topInset}px`);
    document.documentElement.style.setProperty('--tg-safe-area-bottom', `${bottomInset}px`);

    if (isInside) {
      document.documentElement.classList.add('tma-app');
      document.body?.classList.add('tma-app');
    }
  },

  /**
   * Native Haptic Feedback (Taptic Engine)
   */
  haptic: {
    selection() {
      const tg = getTg();
      try {
        tg?.HapticFeedback?.selectionChanged();
      } catch (e) {}
    },
    impact(style = 'medium') {
      const tg = getTg();
      try {
        tg?.HapticFeedback?.impactOccurred(style);
      } catch (e) {}
    },
    notification(type = 'success') {
      const tg = getTg();
      try {
        tg?.HapticFeedback?.notificationOccurred(type);
      } catch (e) {}
    },
  },

  /**
   * Request to add app shortcut to device home screen (Mini Apps 2.0)
   */
  addToHomeScreen() {
    const tg = getTg();
    if (tg && typeof tg.addToHomeScreen === 'function') {
      tg.addToHomeScreen();
      return true;
    }
    return false;
  },

  /**
   * Share cake or custom design directly to Telegram Story
   */
  shareToStory(mediaUrl, params = {}) {
    const tg = getTg();
    if (tg && typeof tg.shareToStory === 'function') {
      tg.shareToStory(mediaUrl, {
        text: params.text || "🎂 Bol Tortlari'dan maxsus tortim!",
        widget_link: {
          url: params.url || 'https://boltortlar.uz',
          name: 'Bol Tortlari',
        },
      });
      return true;
    }
    return false;
  },

  /**
   * Open Telegram Stars Invoice
   */
  openInvoice(invoiceLink, callback) {
    const tg = getTg();
    if (tg && typeof tg.openInvoice === 'function') {
      tg.openInvoice(invoiceLink, (status) => {
        if (typeof callback === 'function') callback(status);
      });
      return true;
    }
    return false;
  },

  /**
   * Check if current user has Telegram Premium
   */
  isPremiumUser() {
    const tg = getTg();
    return Boolean(tg?.initDataUnsafe?.user?.is_premium);
  },

  /**
   * Get Telegram User Data
   */
  getUser() {
    const tg = getTg();
    return tg?.initDataUnsafe?.user || null;
  },

  /**
   * Get Telegram Raw initData string for authentication
   */
  getInitData() {
    const tg = getTg();
    return tg?.initData || '';
  },
};

export default telegramWebApp;
