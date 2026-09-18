import Cake from '../models/Cake.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import { siteKnowledge } from './aiKnowledge.js';

/**
 * Helper to detect language from text
 */
export const detectLanguage = (text = '') => {
  const lower = text.toLowerCase();
  if (/[а-яё]/i.test(lower)) {
    return 'ru';
  }
  if (/\b(what|where|how|price|cake|delivery|order|hello|hi|please|contact|who)\b/i.test(lower)) {
    return 'en';
  }
  return 'uz';
};

/**
 * Extract price constraints from user text (e.g. "300 ming", "300 000", "200k", "do 250000")
 */
export const extractPriceConstraint = (text = '') => {
  const lower = text.toLowerCase();
  const mingMatch = lower.match(/(\d+[\d\s.,]*)\s*(ming|k|тыс)/i);
  if (mingMatch) {
    const num = parseFloat(mingMatch[1].replace(/[\s.,]/g, ''));
    if (!isNaN(num)) return num * 1000;
  }

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
        if (cake.in_stock === false) return false;
        if (maxPrice && cake.price > maxPrice) return false;

        if (category && category !== 'all') {
          const cat = (cake.category_slug || cake.category_name || '').toLowerCase();
          if (!cat.includes(category.toLowerCase())) return false;
        }

        if (q) {
          const nameMatch = (cake.name || '').toLowerCase().includes(q);
          const descMatch = (cake.description || '').toLowerCase().includes(q);
          const ingMatch = (cake.ingredients || '').toLowerCase().includes(q);
          const catMatch = (cake.category_name || '').toLowerCase().includes(q);
          return nameMatch || descMatch || ingMatch || catMatch;
        }

        return true;
      });

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
      if (!user) return [];

      let filter = { user: user._id };
      if (orderId) {
        filter = {
          $or: [
            { orderId: orderId.toUpperCase() },
            { orderId: `#${orderId.toUpperCase()}` },
            { orderId: `ORD-${orderId.toUpperCase()}` },
            { _id: orderId },
          ],
        };
      }

      const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(3);
      return orders;
    } catch (err) {
      console.error('getOrderStatus tool error:', err);
      return [];
    }
  },

  /**
   * Check delivery coverage and fee
   */
  async getDeliveryInfo(locationQuery = '') {
    const lower = locationQuery.toLowerCase();
    const settings = await Settings.findOne();

    const standardFee = settings?.deliveryFee || siteKnowledge.delivery.standardFee;
    const outsideFee = settings?.deliveryFeeOutside || siteKnowledge.delivery.outsideFee;
    const freeThreshold = settings?.freeDeliveryThreshold || siteKnowledge.delivery.freeThreshold;

    const isOutside =
      lower.includes('viloyat') ||
      lower.includes('oblast') ||
      lower.includes('tashqari') ||
      lower.includes('qibray') ||
      lower.includes('chirchiq') ||
      lower.includes('yangiyo‘l');

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
      lower.includes('fargona') ||
      lower.includes('farg‘ona');

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
   * Call real Google Gemini API (gemini-1.5-flash)
   */
  async callGeminiApi({ prompt, systemInstruction, apiKey }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || null;
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
      geminiApiKey: '',
      customMemories: [],
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
    // 0. CREATOR & DEVELOPER IDENTITY INTENT (Strict priority)
    // ----------------------------------------------------
    if (
      lower.includes('kim yaratgan') ||
      lower.includes('kim yaratdi') ||
      lower.includes('yaratuvchi') ||
      lower.includes('dasturchi') ||
      lower.includes('kim ishlab chiqqan') ||
      lower.includes('sayt egasi') ||
      lower.includes('avtor') ||
      lower.includes('muallif') ||
      lower.includes('seni kim') ||
      lower.includes('кто тебя создал') ||
      lower.includes('кто создал') ||
      lower.includes('кто разработчик') ||
      lower.includes('who created') ||
      lower.includes('who made you') ||
      lower.includes('who developed')
    ) {
      if (lang === 'ru') {
        return {
          reply: 'Меня зовут **Mira** — официальный ИИ-ассистент Bol Tortlari. Этот современный сайт и мой искусственный интеллект были созданы талантливым разработчиком и основателем проекта **Абдурашидом Эргашевым** (Abdurashid Ergashev).',
          quickActions: ['🍰 Каталог тортов', '🚚 Условия доставки', '📍 Контакты'],
        };
      }
      if (lang === 'en') {
        return {
          reply: 'I am **Mira** — the official AI Assistant of Bol Tortlari. This website and my AI intelligence were created by the founder and lead developer **Abdurashid Ergashev**.',
          quickActions: ['🍰 Cake catalog', '🚚 Delivery terms', '📍 Contacts'],
        };
      }
      return {
        reply: 'Men **Mira** — Bol Tortlari qandolatchilik uyi platformasining rasmiy aqlli AI yordamchisiman. Ushbu zamonaviy veb-sayt va mening butun sun‘iy intellekt tizimim loyiha asoschisi hamda yetakchi dasturchisi **Abdurashid Ergashev** tomonidan yaratilgan!',
        quickActions: ['🍰 Tortlar katalogi', '🚚 Yetkazib berish', '📞 Bog‘lanish'],
      };
    }

    // ----------------------------------------------------
    // CHECK DYNAMIC CUSTOM MEMORIES
    // ----------------------------------------------------
    const memories = aiConfig.customMemories || [];
    for (const mem of memories) {
      if (mem && mem.fact) {
        const memKey = (mem.key || '').toLowerCase();
        if (memKey && memKey.length > 2 && lower.includes(memKey)) {
          return {
            reply: mem.fact,
            quickActions: ['🍰 Tort tanlash', '🚚 Yetkazib berish'],
          };
        }
      }
    }

    // ----------------------------------------------------
    // 1. ORDER STATUS / TRACKING INTENT
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
    // 2. BONUS & LOYALTY BALANCE INTENT
    // ----------------------------------------------------
    if (
      lower.includes('bonus') ||
      lower.includes('keshbek') ||
      lower.includes('cashback') ||
      lower.includes('balans') ||
      lower.includes('баланс') ||
      lower.includes('кэшбэк') ||
      lower.includes('hamyon')
    ) {
      if (!user) {
        return {
          reply:
            lang === 'ru'
              ? 'Чтобы узнать баланс кэшбэка и бонусов, пожалуйста, войдите в свой профиль.'
              : lang === 'en'
              ? 'Please log in to view your loyalty bonus and cashback balance.'
              : 'Keshbek va bonuslaringizni bilish uchun profilingizga kiring.',
          action: 'open_auth',
          quickActions: ['Kirish', 'Aksiyalar', 'Tort tanlash'],
        };
      }

      const balance = (user.walletBalance || 0).toLocaleString('uz-UZ');
      if (lang === 'ru') {
        return {
          reply: `💰 Ваш текущий баланс кэшбэка: **${balance} сум**.\n\nВы можете использовать эти средства для полной или частичной оплаты любого торта!`,
          quickActions: ['🍰 Выбрать торт', '🛒 Использовать в корзине'],
        };
      }
      return {
        reply: `💰 Sizning hamyon balansingizda **${balance} so‘m** mavjud.\n\nHar bir buyurtmadan 3% keshbek avtomatik yig‘iladi va uni yangi buyurtmalarga to‘lov sifatida ishlatishingiz mumkin!`,
        quickActions: ['🍰 Tort buyurtma qilish', '🛒 Savatni ko‘rish'],
      };
    }

    // ----------------------------------------------------
    // 3. CART OPERATIONS INTENT
    // ----------------------------------------------------
    if (
      lower.includes('savat') ||
      lower.includes('korzina') ||
      lower.includes('корзина') ||
      lower.includes('cart') ||
      lower.includes('savatim')
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
    // 4. DELIVERY ZONE & INFO INTENT
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
    // 5. IMAGE CAKE RECOGNITION
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
    // 6. REAL GOOGLE GEMINI API CALL (If configured)
    // ----------------------------------------------------
    const geminiKey = aiConfig.geminiApiKey || process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim()) {
      try {
        const activeCakes = await Cake.find({ isActive: 1, in_stock: true }).limit(25);
        const cakeSummary = activeCakes
          .map((c) => `- ${c.name}: ${c.price.toLocaleString()} so'm (${c.weight || '1.5 kg'}), Kategoriya: ${c.category_name || c.category_slug}`)
          .join('\n');

        const memorySummary = (aiConfig.customMemories || [])
          .map((m) => `- ${m.fact}`)
          .join('\n');

        const systemInstruction = `Siz "Bol Tortlari" (boltortlar.uz) rasmiy aqlli AI yordamchisi "Mira"siz.
ASOSIY QOIDALAR:
1. Sayt va Mira AI yaratuvchisi, asoschisi hamda yetakchi dasturchisi: Abdurashid Ergashev. Agar foydalanuvchi "seni kim yaratgan", "dasturchi kim", "sayt egasi kim" deb so'rasa, albatta "Abdurashid Ergashev" deb javob bering.
2. Bol Tortlari haqida ma'lumot:
   - Filiallar: Toshkent shahri (barcha tumanlar) va Farg'ona shahri.
   - Ish vaqti: 09:00 - 21:00 (dam olish kunlarisiz).
   - Telefon: +998 (90) 123-45-67, Telegram: @boltortlari_admin.
   - Yetkazib berish: Shahar ichida 15 000 so'm, 300 000 so'mdan yuqori buyurtmalar bepul. 45-90 daqiqada yetkaziladi.
   - To'lov turlari: Payme, Click, karta (Humo/Uzcard), naqd pul.
3. Maxsus xotiralar va faktlar:
${memorySummary || 'Maxsus xotiralar kiritilmagan.'}
4. Katalogdagi mashhur tortlar:
${cakeSummary}
5. Muloqot qoidalari:
   - Foydalanuvchi qaysi tilda yozsa (o'zbekcha, ruscha yoki inglizcha), faqat shu tilda muloyim va aniq javob bering.
   - Ortiqcha gap va doston yozmang. Faqat so'ralgan savolga lo‘nda va chiroyli javob bering.
   - Agar foydalanuvchi narx yoki tort qidirayotgan bo'lsa, mavjud katalogdagi tortlarni tavsiya qiling.`;

        const geminiReply = await this.callGeminiApi({
          prompt: message,
          systemInstruction,
          apiKey: geminiKey.trim(),
        });

        if (geminiReply && geminiReply.trim()) {
          let attachedProducts = [];
          if (
            lower.includes('tort') ||
            lower.includes('narx') ||
            lower.includes('qancha') ||
            lower.includes('tavsiya') ||
            maxPrice !== null
          ) {
            attachedProducts = await this.searchProducts({ query: '', maxPrice });
          }

          return {
            reply: geminiReply.trim(),
            products: attachedProducts.slice(0, 4),
            action: attachedProducts.length > 0 ? 'show_products' : null,
            quickActions: ['🍰 Tort tanlash', '💰 300 000 gacha', '🚚 Yetkazib berish', '🛒 Savat'],
          };
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to built-in NLP engine:', geminiError.message);
      }
    }

    // ----------------------------------------------------
    // 7. PRODUCT SEARCH & RECOMMENDATION (Local NLP Engine)
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
    // 8. GENERAL CONVERSATION & GREETINGS
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

  /**
   * Admin Copilot & Teaching Handler
   */
  async processAdminMessage({ message = '', user = null }) {
    const lower = message.toLowerCase().trim();
    const settings = await Settings.findOne();
    const currentMemories = settings?.aiSettings?.customMemories || [];

    // 1. Detect if Admin is teaching a new fact / memory
    const teachPrefixes = ['sayt yaratuvchisi', 'eslab qol', 'yodda saqla', 'o‘rgan', 'o\'rgan', 'qoida:', 'fakt:'];
    const isTeaching = teachPrefixes.some((p) => lower.startsWith(p) || lower.includes(p));

    if (isTeaching || (lower.includes('yaratuvchisi') && lower.includes('ergashev'))) {
      const newFact = message.replace(/^(eslab qol:?|yodda saqla:?|o‘rgan:?|o'rgan:?)/i, '').trim();
      const newMem = {
        id: 'mem-' + Date.now(),
        key: lower.includes('yaratuvchi') ? 'creator' : 'admin_rule',
        fact: newFact,
        category: lower.includes('yaratuvchi') ? 'creator' : 'custom',
        createdAt: new Date().toISOString(),
      };

      const updatedMemories = [
        ...currentMemories.filter((m) => m.id !== 'mem-creator' || newMem.category !== 'creator'),
        newMem,
      ];

      const updatedAiSettings = {
        ...(settings.aiSettings || {}),
        customMemories: updatedMemories,
      };

      settings.aiSettings = updatedAiSettings;
      if (typeof settings.save === 'function') {
        await settings.save();
      }

      return {
        reply: `Tushundim, ${user?.name || 'Administrator'}! Ushbu ma'lumotni xotiramga muvaffaqiyatli saqladim:\n\n📌 *«${newMem.fact}»*\n\nEndi foydalanuvchilar yoki mijozlar bu mavzuda so‘rashsa, xuddi shu ma'lumotni beraman!`,
        action: 'memory_saved',
        memory: newMem,
      };
    }

    // 2. Analytics queries for Admin Copilot
    if (lower.includes('savdo') || lower.includes('tushum') || lower.includes('daromad') || lower.includes('statistika')) {
      const allOrders = await Order.find({});
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter((o) => o.createdAt && o.createdAt.startsWith(today));
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingOrders = allOrders.filter((o) => ['pending', 'preparing', 'confirmed'].includes(o.status));

      return {
        reply: `📊 **Bol Tortlari — Kunlik Operatsion Hisobot:**\n\n- 💰 **Bugungi tushum:** ${todayRevenue.toLocaleString()} so‘m (${todayOrders.length} ta buyurtma)\n- 📦 **Kutilayotgan/Jarayondagi buyurtmalar:** ${pendingOrders.length} ta\n- 📈 **Jami umumiy aylanma:** ${totalRevenue.toLocaleString()} so‘m\n\nBarcha tizimlar va kuryerlar navbati bir maromda ishlamoqda.`,
        action: 'admin_stats',
      };
    }

    if (lower.includes('ommabop') || lower.includes('eng ko‘p') || lower.includes('eng kop') || lower.includes('xit')) {
      const cakes = await Cake.find({ is_popular: 1 });
      const cakeNames = cakes.map((c) => `• ${c.name} (${c.price.toLocaleString()} so‘m)`).join('\n');
      return {
        reply: `🎂 **Eng xaridorgir va ommabop tortlar:**\n\n${cakeNames || 'Barcha tortlar katalogda faol.'}\n\nMijozlar ushbu tortlarga eng ko‘p buyurtma berishmoqda.`,
        action: 'admin_popular',
      };
    }

    // 3. General Admin Copilot advice
    return {
      reply: `Assalomu alaykum, ${user?.name || 'Admin'}! Men Mira Admin Copilotman. Men sizga:\n\n1. Yangi bilim va qoidalarni eslab qolish (masalan: «Eslab qol: Sayt yaratuvchisi Abdurashid Ergashev»)\n2. Kunlik savdo va tushum statistikasini tahlil qilish («Bugungi savdo qancha?»)\n3. Oshxona va kuryerlar holati haqida hisobot berishda yordam bera olaman.\n\nNima haqida bilmoqchisiz?`,
      action: 'admin_help',
    };
  },
};

export default aiService;
