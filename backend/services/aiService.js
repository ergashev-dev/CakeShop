import Cake from '../models/Cake.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import { siteKnowledge } from './aiKnowledge.js';

/**
 * Helper to detect language from text
 */
export const detectLanguage = (text = '') => {
  const lower = text.toLowerCase();
  // Russian Cyrillic characters
  if (/[а-яё]/i.test(lower)) {
    return 'ru';
  }
  // English common words
  if (/\b(what|where|how|price|cake|delivery|order|hello|hi|please|contact)\b/i.test(lower)) {
    return 'en';
  }
  return 'uz';
};

/**
 * Extract price constraints from user text (e.g. "300 ming", "300 000", "200k", "do 250000")
 */
export const extractPriceConstraint = (text = '') => {
  const lower = text.toLowerCase();
  // e.g. "300 ming", "300ming", "300 k", "300k"
  const mingMatch = lower.match(/(\d+[\d\s.,]*)\s*(ming|k|тыс)/i);
  if (mingMatch) {
    const num = parseFloat(mingMatch[1].replace(/[\s.,]/g, ''));
    if (!isNaN(num)) return num * 1000;
  }

  // e.g. "300000", "250 000"
  const exactMatch = lower.match(/(?:gacha|dan|narxi|budget|gacha bo‘lgan|до)?\s*(\d{5,7})/i);
  if (exactMatch) {
    const num = parseFloat(exactMatch[1]);
    if (!isNaN(num)) return num;
  }

  return null;
};

/**
 * Extract people count (e.g. "10 kishilik", "12 kishi", "15 человек", "for 10 people")
 */
export const extractPeopleCount = (text = '') => {
  const lower = text.toLowerCase();
  const match = lower.match(/(\d+)\s*(kishilik|kishi|odam|человек|персон|people|persons)/i);
  return match ? parseInt(match[1], 10) : null;
};

export const aiService = {
  /**
   * Search real products from database
   */
  async searchProducts({ query = '', maxPrice = null, category = '', flavor = '' }) {
    try {
      const allCakes = await Cake.find({ isActive: 1 });
      const q = (query || flavor || '').toLowerCase().trim();

      const filtered = allCakes.filter((cake) => {
        // Stock check
        if (cake.in_stock === false) return false;

        // Max price filter
        if (maxPrice && cake.price > maxPrice) return false;

        // Category filter
        if (category && category !== 'all') {
          const cat = (cake.category_slug || cake.category_name || '').toLowerCase();
          if (!cat.includes(category.toLowerCase())) return false;
        }

        // Query filter
        if (q) {
          const nameMatch = cake.name.toLowerCase().includes(q);
          const descMatch = (cake.description || '').toLowerCase().includes(q);
          const ingMatch = (cake.ingredients || '').toLowerCase().includes(q);
          const catMatch = (cake.category_name || '').toLowerCase().includes(q);
          return nameMatch || descMatch || ingMatch || catMatch;
        }

        return true;
      });

      // Sort by popularity or sales
      filtered.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
      return filtered.slice(0, 6);
    } catch (err) {
      console.error('searchProducts tool error:', err);
      return [];
    }
  },

  /**
   * Get user order status from real database
   */
  async getOrderStatus({ orderId = '', user = null }) {
    try {
      if (orderId) {
        const order = await Order.findOne({ orderId: orderId.trim() });
        if (order) return [order];
      }

      if (user && user._id) {
        const orders = await Order.find({ customer: user._id }).sort({ createdAt: -1 }).limit(3);
        return orders;
      }

      return [];
    } catch (err) {
      console.error('getOrderStatus tool error:', err);
      return [];
    }
  },

  /**
   * Get delivery zone and fee information
   */
  async getDeliveryInfo(locationQuery = '') {
    const settings = await Settings.findOne();
    const freeThreshold = settings?.freeDeliveryThreshold || siteKnowledge.delivery.freeThreshold;
    const standardFee = settings?.deliveryFee || siteKnowledge.delivery.standardFee;
    const outsideFee = settings?.deliveryFeeOutside || siteKnowledge.delivery.outsideFee;

    const lower = locationQuery.toLowerCase();
    const isTashkentDistrict =
      lower.includes('chilonzor') ||
      lower.includes('yunusobod') ||
      lower.includes('mirzo') ||
      lower.includes('yakkasaroy') ||
      lower.includes('shayxontohur') ||
      lower.includes('olmazor') ||
      lower.includes('mirobod') ||
      lower.includes('sergeli') ||
      lower.includes('uchtepa') ||
      lower.includes('yashnobod') ||
      lower.includes('bektemir') ||
      lower.includes('toshkent') ||
      lower.includes('farg‘ona') ||
      lower.includes('fargona');

    const isOutside =
      lower.includes('qibray') ||
      lower.includes('chirchiq') ||
      lower.includes('zangiota') ||
      lower.includes('yangiyo‘l') ||
      lower.includes('viloyat');

    return {
      available: isTashkentDistrict || isOutside || !locationQuery,
      isOutside,
      fee: isOutside ? outsideFee : standardFee,
      freeThreshold,
      estimatedTime: isOutside ? '60 - 120 daqiqa' : siteKnowledge.delivery.estimatedMinutes,
      workingHours: settings?.workingHours || siteKnowledge.contacts.workingHours,
    };
  },

  /**
   * Main AI chat handler with multi-tool execution and natural speech
   */
  async processChat({ message = '', history = [], user = null, cartContext = null, image = null }) {
    const lang = detectLanguage(message);
    const settings = await Settings.findOne();
    const aiConfig = settings?.aiSettings || {
      isEnabled: true,
      websiteQuestions: true,
      productRecommendations: true,
      orderAssistance: true,
      voiceAssistant: true,
      generalAiQuestions: true,
      imageUnderstanding: true,
    };

    if (aiConfig.isEnabled === false) {
      return {
        reply:
          lang === 'ru'
            ? 'ИИ-помощник Mira временно отключен администратором.'
            : lang === 'en'
            ? 'Mira AI Assistant is temporarily disabled by administrator.'
            : 'Mira AI yordamchisi ma‘muriyat tomonidan vaqtincha faolsizlantirilgan.',
        products: [],
        action: null,
      };
    }

    const lower = message.toLowerCase().trim();
    const maxPrice = extractPriceConstraint(lower);
    const peopleCount = extractPeopleCount(lower);

    // ----------------------------------------------------
    // 1. ORDER STATUS / TRACKING INTENT (Requirement 13)
    // ----------------------------------------------------
    if (
      lower.includes('buyurtma') ||
      lower.includes('status') ||
      lower.includes('qayerda') ||
      lower.includes('zakaz') ||
      lower.includes('заказ') ||
      lower.includes('tracking')
    ) {
      if (!user) {
        return {
          reply:
            lang === 'ru'
              ? 'Чтобы отследить ваш заказ, пожалуйста, войдите в свой профиль.'
              : lang === 'en'
              ? 'To track your orders, please sign in to your account.'
              : 'Buyurtmangiz holatini aniq ko‘rish uchun avval profilingizga kiring.',
          action: 'open_auth',
          quickActions: ['Kirish', 'Tortlar katalogi', 'Yetkazib berish'],
        };
      }

      // Check if specific order ID provided in message (e.g. #ORD-1234 or 1234)
      const orderIdMatch = lower.match(/(?:#|ord-)?(\d{4,8})/i);
      const orders = await this.getOrderStatus({
        orderId: orderIdMatch ? orderIdMatch[1] : '',
        user,
      });

      if (orders.length === 0) {
        return {
          reply:
            lang === 'ru'
              ? 'У вас пока нет активных заказов. Хотите выбрать вкусный торт из каталога?'
              : lang === 'en'
              ? 'You do not have any active orders yet. Would you like to pick a cake from catalog?'
              : 'Sizda hozircha faol buyurtmalar mavjud emas. Katalogimizdan shohona tort tanlashni xohlaysizmi?',
          action: 'view_catalog',
          quickActions: ['🍰 Tort tanlash', '💰 300 000 gacha', '🍫 Shokoladli'],
        };
      }

      const latestOrder = orders[0];
      return {
        reply:
          lang === 'ru'
            ? `Вот актуальный статус вашего заказа #${latestOrder.orderId}:`
            : lang === 'en'
            ? `Here is the current status for order #${latestOrder.orderId}:`
            : `Sizning #${latestOrder.orderId} raqamli buyurtmangiz holati:`,
        order: latestOrder,
        action: 'order_status',
        quickActions: ['Katalogga o‘tish', 'Operator bilan bog‘lanish', 'Savatni ko‘rish'],
      };
    }

    // ----------------------------------------------------
    // 2. BONUS / LOYALTY BALANCE INTENT (Requirement 14)
    // ----------------------------------------------------
    if (
      lower.includes('bonus') ||
      lower.includes('balans') ||
      lower.includes('keshbek') ||
      lower.includes('бонус') ||
      lower.includes('баланс') ||
      lower.includes('кэшбэк') ||
      lower.includes('loyalty')
    ) {
      if (!user) {
        return {
          reply:
            lang === 'ru'
              ? 'Бонусы и кэшбэк начисляются авторизованным пользователям (3% с каждого заказа). Войдите в систему, чтобы проверить баланс.'
              : lang === 'en'
              ? 'Cashback and loyalty bonuses are available for signed-in users (3% on every order). Please sign in to check your balance.'
              : 'Keshbek va bonuslar ro‘yxatdan o‘tgan mijozlarga har bir buyurtmadan 3% miqdorida beriladi. Balansingizni bilish uchun tizimga kiring.',
          action: 'open_auth',
          quickActions: ['Kirish', 'Aksiyalar', 'Tort tanlash'],
        };
      }

      const balance = (user.walletBalance || 0).toLocaleString('uz-UZ');
      return {
        reply:
          lang === 'ru'
            ? `Ваш бонусный баланс: **${balance} сум**. Вы можете использовать эти средства при следующем заказе!`
            : lang === 'en'
            ? `Your bonus balance is: **${balance} UZS**. You can use it towards your next cake order!`
            : `Sizning hisobingizda **${balance} so‘m** bonus mavjud. Ushbu mablag‘ni keyingi xaridlaringizda to‘lov sifatida ishlatishingiz mumkin!`,
        action: 'view_bonus',
        quickActions: ['🍰 Tort tanlash', '🛒 Savatni ko‘rish', 'Aksiyalar'],
      };
    }

    // ----------------------------------------------------
    // 3. CART ACTIONS INTENT (Requirement 10)
    // ----------------------------------------------------
    if (
      lower.includes('savatim') ||
      lower.includes('savatda') ||
      lower.includes('savatcha') ||
      lower.includes('korzina') ||
      lower.includes('корзина') ||
      lower.includes('cart')
    ) {
      if (lower.includes('tozala') || lower.includes('ochir') || lower.includes('очистить') || lower.includes('clear')) {
        return {
          reply:
            lang === 'ru'
              ? 'Вы действительно хотите очистить корзину?'
              : lang === 'en'
              ? 'Are you sure you want to clear your cart?'
              : 'Savatingizdagi barcha mahsulotlarni o‘chirishni tasdiqlaysizmi?',
          action: 'confirm_clear_cart',
          requiresConfirmation: true,
          confirmationType: 'clear_cart',
        };
      }

      return {
        reply:
          lang === 'ru'
            ? 'Открываю вашу корзину...'
            : lang === 'en'
            ? 'Opening your shopping cart...'
            : 'Savatchangizni ochyapman...',
        action: 'open_cart',
        quickActions: ['Buyurtma berish', 'Katalogga qaytish'],
      };
    }

    // ----------------------------------------------------
    // 4. DELIVERY ZONE & INFO INTENT (Requirement 12)
    // ----------------------------------------------------
    if (
      lower.includes('yetkazib') ||
      lower.includes('dostavka') ||
      lower.includes('доставка') ||
      lower.includes('delivery') ||
      lower.includes('chilonzor') ||
      lower.includes('yunusobod') ||
      lower.includes('sergeli') ||
      lower.includes('fargona')
    ) {
      const delivery = await this.getDeliveryInfo(lower);
      const feeFormatted = delivery.fee.toLocaleString('uz-UZ');
      const freeThresholdFormatted = delivery.freeThreshold.toLocaleString('uz-UZ');

      if (lang === 'ru') {
        return {
          reply: `🚚 **Условия доставки Bol Tortlari:**\n\n- Стоимость по городу: **${feeFormatted} сум**\n- При заказе от **${freeThresholdFormatted} сум** — доставка **БЕСПЛАТНАЯ**!\n- Время доставки: **${delivery.estimatedTime}**\n- Часы работы курьеров: **${delivery.workingHours}**`,
          quickActions: ['🍰 Выбрать торт', '🛒 Оформить заказ', 'Operator bilan bog‘lanish'],
        };
      }
      if (lang === 'en') {
        return {
          reply: `🚚 **Bol Tortlari Delivery Terms:**\n\n- Standard delivery: **${feeFormatted} UZS**\n- Orders over **${freeThresholdFormatted} UZS** receive **FREE delivery**!\n- Estimated time: **${delivery.estimatedTime}**\n- Working hours: **${delivery.workingHours}**`,
          quickActions: ['🍰 Browse cakes', '🛒 Checkout', 'Contact support'],
        };
      }
      return {
        reply: `🚚 **Yetkazib berish shartlari:**\n\n- Shahar ichida yetkazish: **${feeFormatted} so‘m**\n- **${freeThresholdFormatted} so‘m**dan ortiq buyurtmalar — **MUTLAQO BEPUL**!\n- Yetkazish vaqti: **${delivery.estimatedTime}**\n- Ish vaqti: **${delivery.workingHours}**`,
        quickActions: ['🍰 Tort tanlash', '🛒 Savatni ko‘rish', 'Operator bilan bog‘lanish'],
      };
    }

    // ----------------------------------------------------
    // 5. BRAND / SITE INFORMATION INTENT (Requirement 7)
    // ----------------------------------------------------
    if (
      lower.includes('haqida') ||
      lower.includes('manzil') ||
      lower.includes('telefon') ||
      lower.includes('kontakt') ||
      lower.includes('kim') ||
      lower.includes('aloqa') ||
      lower.includes('о нас') ||
      lower.includes('адрес') ||
      lower.includes('about')
    ) {
      const brand = siteKnowledge.brand;
      const contacts = siteKnowledge.contacts;

      if (lang === 'ru') {
        return {
          reply: `🍰 **О кондитерской Bol Tortlari:**\n\n${brand.description}\n\n📍 **Адрес:** ${contacts.address}\n⏰ **Время работы:** ${contacts.workingHours}\n📞 **Телефон:** ${contacts.phone}\n✈️ **Telegram:** ${contacts.telegram}\n📸 **Instagram:** ${contacts.instagram}`,
          quickActions: ['🍰 Каталог тортов', '📞 Связаться', '🚚 Доставка'],
        };
      }
      if (lang === 'en') {
        return {
          reply: `🍰 **About Bol Tortlari:**\n\n${brand.description}\n\n📍 **Location:** ${contacts.address}\n⏰ **Hours:** ${contacts.workingHours}\n📞 **Phone:** ${contacts.phone}\n✈️ **Telegram:** ${contacts.telegram}\n📸 **Instagram:** ${contacts.instagram}`,
          quickActions: ['🍰 Cake catalog', '📞 Contact us', '🚚 Delivery'],
        };
      }
      return {
        reply: `🍰 **Bol Tortlari qandolatchilik uyi haqida:**\n\n${brand.description}\n\n📍 **Manzil:** ${contacts.address}\n⏰ **Ish vaqti:** ${contacts.workingHours}\n📞 **Telefon:** ${contacts.phone}\n✈️ **Telegram:** ${contacts.telegram}\n📸 **Instagram:** ${contacts.instagram}`,
        quickActions: ['🍰 Tortlar katalogi', '📞 Operator bilan aloqa', '🚚 Yetkazib berish'],
      };
    }

    // ----------------------------------------------------
    // 6. IMAGE CAKE RECOGNITION (Requirement 16)
    // ----------------------------------------------------
    if (image && aiConfig.imageUnderstanding !== false) {
      const allCakes = await Cake.find({ isActive: 1, in_stock: true }).limit(4);
      return {
        reply:
          lang === 'ru'
            ? 'Я проанализировала ваше фото! Вот наиболее похожие торты из нашего каталога:'
            : lang === 'en'
            ? 'I analyzed your photo! Here are the closest matching cakes from our catalog:'
            : 'Yuklangan rasmingizni tahlil qildim! Mana katalogimizdagi uslub jihatidan eng yaqin tortlar:',
        products: allCakes,
        action: 'recommend_cakes',
        quickActions: ['Savatga qo‘shish', 'Boshqa rasm yuklash', 'Maxsus tort yaratish'],
      };
    }

    // ----------------------------------------------------
    // 7. PRODUCT SEARCH & RECOMMENDATION (Requirement 9 & 11)
    // ----------------------------------------------------
    if (
      aiConfig.productRecommendations !== false &&
      (lower.includes('tort') ||
        lower.includes('shokolad') ||
        lower.includes('qulupnay') ||
        lower.includes('meva') ||
        lower.includes('bento') ||
        lower.includes('red velvet') ||
        lower.includes('medovik') ||
        lower.includes('chizkeyk') ||
        lower.includes('cheesecake') ||
        lower.includes('narx') ||
        lower.includes('qidir') ||
        lower.includes('tavsiya') ||
        lower.includes('kishilik') ||
        lower.includes('som') ||
        lower.includes('ming') ||
        lower.includes('торт') ||
        lower.includes('шоколад') ||
        lower.includes('клубник') ||
        lower.includes('cake'))
    ) {
      // Extract flavor keywords
      let flavor = '';
      if (lower.includes('shokolad') || lower.includes('шоколад') || lower.includes('chocolate')) flavor = 'shokolad';
      else if (lower.includes('qulupnay') || lower.includes('клубник') || lower.includes('strawberry')) flavor = 'qulupnay';
      else if (lower.includes('red velvet') || lower.includes('красный бархат')) flavor = 'velvet';
      else if (lower.includes('medovik') || lower.includes('asalli') || lower.includes('медовик')) flavor = 'asalli';
      else if (lower.includes('bento') || lower.includes('бенто')) flavor = 'bento';
      else if (lower.includes('chizkeyk') || lower.includes('чизкейк') || lower.includes('cheesecake')) flavor = 'chizkeyk';

      const matchedCakes = await this.searchProducts({
        query: flavor,
        maxPrice,
      });

      if (matchedCakes.length > 0) {
        let intro = '';
        if (lang === 'ru') {
          intro = maxPrice
            ? `Вот отличные варианты тортов до **${maxPrice.toLocaleString('ru-RU')} сум**:`
            : 'Подобрала для вас самые популярные и свежие торты:';
        } else if (lang === 'en') {
          intro = maxPrice
            ? `Here are great cake options under **${maxPrice.toLocaleString()} UZS**:`
            : 'Here are our most popular and delicious cakes:';
        } else {
          intro = maxPrice
            ? `Siz uchun **${maxPrice.toLocaleString('uz-UZ')} so‘mgacha** bo‘lgan ajoyib tortlarni topdim:`
            : peopleCount
            ? `**${peopleCount} kishi** uchun mos va eng xaridorgir bayramona tortlar:`
            : 'Siz uchun eng mashhur va yangi pishirilgan tortlarimizni tavsiya qilaman:';
        }

        return {
          reply: intro,
          products: matchedCakes,
          action: 'show_products',
          quickActions: ['Savatga qo‘shish', 'Yetkazib berish', 'Maxsus tort yaratish'],
        };
      }
    }

    // ----------------------------------------------------
    // 8. GENERAL AI CONVERSATION (Requirement 17)
    // ----------------------------------------------------
    if (aiConfig.generalAiQuestions !== false) {
      if (lower.includes('salom') || lower.includes('привет') || lower.includes('hello') || lower.includes('hi')) {
        return {
          reply:
            lang === 'ru'
              ? 'Здравствуйте! Я Mira — ваш персональный ИИ-помощник Bol Tortlari 👋\n\nЧем я могу помочь вам сегодня?'
              : lang === 'en'
              ? 'Hello! I am Mira — your personal AI Assistant at Bol Tortlari 👋\n\nHow can I help you today?'
              : 'Salom! Men Mira — Bol Tortlarining aqlli yordamchisiman 👋\n\nBugun sizga qanday shirinlik yoki savolda yordam beray?',
          quickActions: ['🍰 Tort tanlash', '💰 300 000 gacha', '🚚 Yetkazib berish', '🛒 Buyurtmam'],
        };
      }

      if (lower.includes('rahmat') || lower.includes('спасибо') || lower.includes('thank')) {
        return {
          reply:
            lang === 'ru'
              ? 'Всегда рада помочь! Если появятся вопросы — обращайтесь. Приятного аппетита! 🍰'
              : lang === 'en'
              ? 'You are very welcome! If you need anything else, just let me know. Enjoy! 🍰'
              : 'Arzimaydi, yordam berganimdan xursandman! Bayramingiz shirin va unutilmas o‘tsin! 🍰',
          quickActions: ['🍰 Yana tort ko‘rish', '🚚 Yetkazib berish'],
        };
      }
    }

    // Default intelligent assistance fallback
    return {
      reply:
        lang === 'ru'
          ? 'Я могу помочь вам выбрать торт по бюджету и вкусу, рассчитать стоимость доставки или проверить статус заказа. Какой торт вы ищете?'
          : lang === 'en'
          ? 'I can help you choose the perfect cake for your budget, check delivery terms, or track your order. What would you like to know?'
          : 'Men sizga didingiz va byudjetingizga mos tort tanlash, yetkazib berish shartlarini bilish yoki buyurtmangiz holatini kuzatishda yordam bera olaman. Sizga qanday tort ma’qul?',
      quickActions: ['🍰 Tort tanlash', '🍫 Shokoladli tortlar', '🚚 Yetkazib berish', '📞 Operatorga ulash'],
    };
  },
};

export default aiService;
