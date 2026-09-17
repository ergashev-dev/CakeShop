import { Telegraf, Markup } from 'telegraf';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cake from '../models/Cake.js';
import Category from '../models/Category.js';
import Settings from '../models/Settings.js';
import { socketService } from './socketService.js';

// Safe helper to find order by orderId or ObjectId
const findOrderSafely = (id) => {
  if (!id) return Promise.resolve(null);
  const isHexObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  return Order.findOne(isHexObjectId ? { $or: [{ orderId: id }, { _id: id }] } : { orderId: id });
};

// Status labels and emojis
export const STATUS_LABELS = {
  pending: '🟡 Kutilmoqda',
  confirmed: '🟢 Qabul qilindi',
  preparing: '👨‍🍳 Tayyorlanmoqda',
  ready: '🧁 Tayyor',
  assigned: '📋 Kuryerga biriktirildi',
  delivering: '🛵 Yo‘lda / Yetkazilmoqda',
  on_the_way: '🛵 Yo‘lda / Yetkazilmoqda',
  delivered: '🎉 Yetkazildi',
  cancelled: '❌ Bekor qilindi',
};

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.botInfo = null;
    this.token = process.env.TELEGRAM_BOT_TOKEN || '8714053884:AAEv-s1LNqPic310IIoKhkl-6alhUjdvmzc';
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '1897925266';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.loginSessions = new Map(); // telegramId -> { step: 'awaiting_login' | 'awaiting_password', login: '' }
  }

  getWebAppUrl() {
    if (process.env.TELEGRAM_WEBAPP_URL) return process.env.TELEGRAM_WEBAPP_URL;
    if (this.clientUrl && this.clientUrl.startsWith('https://')) return this.clientUrl;
    return 'https://boltortlar.uz';
  }

  isHttps() {
    return Boolean(this.clientUrl && this.clientUrl.startsWith('https://'));
  }

  async isUserAdmin(telegramId) {
    if (!telegramId) return false;
    if (telegramId.toString() === this.adminChatId.toString()) return true;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    return Boolean(user && ['super_admin', 'superadmin', 'admin'].includes(user.role));
  }

  getUnlinkedKeyboard() {
    return Markup.keyboard([
      ['🔑 Botda tizimga kirish', '🔗 Sayt orqali ulash'],
      [Markup.button.webApp('🚀 Web App (Mini App)', this.getWebAppUrl()), '📞 Aloqa & Manzil'],
    ]).resize();
  }

  getMainKeyboard(isAdmin = false) {
    const catalogBtn = '🎂 Tortlar Katalogi';
    const webAppBtn = Markup.button.webApp('🚀 Web App', this.getWebAppUrl());

    if (isAdmin) {
      return Markup.keyboard([
        [catalogBtn, '📦 Buyurtmalarim'],
        ['❤️ Sevimlilar', '💰 Hamyon & Keshbek'],
        ['⚙️ Admin Paneli', '👤 Shaxsiy Profil'],
        [webAppBtn, '🚪 Hisobdan chiqish'],
      ]).resize();
    }

    return Markup.keyboard([
      [catalogBtn, '📦 Buyurtmalarim'],
      ['❤️ Sevimlilar', '💰 Hamyon & Keshbek'],
      ['👤 Shaxsiy Profil', '📞 Aloqa & Manzil'],
      [webAppBtn, '🚪 Hisobdan chiqish'],
    ]).resize();
  }

  getInlineWebButton(label, path = '') {
    const fullUrl = `${this.clientUrl}${path}`;
    if (this.isHttps()) {
      return Markup.inlineKeyboard([[Markup.button.webApp(label, fullUrl)]]);
    }
    return null;
  }

  async getLinkedUser(telegramId) {
    if (!telegramId) return null;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    if (user && !user.isBlocked) {
      return user;
    }
    return null;
  }

  async requireAuth(ctx) {
    const telegramId = ctx.from?.id?.toString();
    const user = await this.getLinkedUser(telegramId);
    if (user) {
      return user;
    }

    if (ctx.callbackQuery) {
      try {
        await ctx.answerCbQuery('🔒 Ushbu amal uchun avval hisobingizga kiring.', { show_alert: true });
      } catch (e) {}
    }

    const lockMsg =
      `🔒 <b>Ushbu bo‘limdan foydalanish uchun hisobingizga kiring!</b>\n\n` +
      `Sizning Telegram profilingiz saytdagi hisobingizga hali ulanmagan.\n` +
      `Barcha sara tortlar katalogi, buyurtmalarni kuzatish, sevimlilar va keshbek tizimi faqat tasdiqlangan foydalanuvchilar uchun ochiq.\n\n` +
      `Quyidagi usullardan birini tanlang:\n` +
      `1️⃣ <b>🔑 Botda tizimga kirish:</b> Botning o‘zida Login va Parolingizni kiritish;\n` +
      `2️⃣ <b>🔗 Sayt orqali ulash:</b> Saytdagi profilingizdan bitta tugma orqali ulash;\n` +
      `3️⃣ <b>🚀 Web App:</b> Telegram ichida to‘liq Mini Appni ochish.`;

    await ctx.reply(lockMsg, {
      parse_mode: 'HTML',
      ...this.getUnlinkedKeyboard(),
    });

    return null;
  }

  async processLogin(ctx, identifier, password) {
    try {
      const telegramId = ctx.from.id.toString();
      const cleanId = (identifier || '').toLowerCase().trim();

      const user = await User.findOne({
        $or: [{ email: cleanId }, { username: cleanId }],
      });

      if (!user) {
        return ctx.reply(
          `❌ <b>Bunday foydalanuvchi topilmadi!</b>\n\n` +
          `Kiritilgan email/username: <code>${cleanId}</code>\n\n` +
          `Iltimos, tekshirib qaytadan urinib ko‘ring yoki saytdan ro‘yxatdan o‘ting:\n` +
          `👉 ${this.clientUrl}/register`,
          { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return ctx.reply(
          `❌ <b>Kiritilgan parol noto‘g‘ri!</b>\n\n` +
          `Iltimos, qaytadan urinib ko‘ring yoki saytdan parolingizni tiklang:\n` +
          `👉 ${this.clientUrl}/login`,
          { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
        );
      }

      if (user.isBlocked) {
        return ctx.reply(
          `⛔ <b>Profilingiz bloklangan.</b> Qo‘llab-quvvatlash xizmati bilan bog‘laning.`,
          { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
        );
      }

      // Link user to Telegram
      user.telegramId = telegramId;
      user.telegramLinkToken = null;
      user.telegramLinkExpires = null;
      user.lastLogin = new Date();
      await user.save();

      // Emit real-time update to web app
      socketService.emitTelegramLinked(user._id.toString(), {
        telegramId,
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || user.name,
      });

      const isAdmin = ['super_admin', 'superadmin', 'admin'].includes(user.role) || telegramId === this.adminChatId;

      return ctx.reply(
        `🎉 <b>Xush kelibsiz, ${user.name}!</b>\n\n` +
        `Sizning <b>${user.email}</b> hisobingiz ushbu Telegram botga muvaffaqiyatli ulandi.\n\n` +
        `• <b>Rol:</b> <code>${user.role}</code>\n` +
        `• <b>Hamyon:</b> ${(user.walletBalance || 0).toLocaleString()} so‘m\n` +
        (isAdmin ? `• <b>Admin imkoniyatlari:</b> Faollashtirildi ⚡\n` : '') +
        `\nEndi botdagi barcha sara tortlar katalogi, buyurtmalar va boshqaruv xizmatlari siz uchun to‘liq ochiq!`,
        { parse_mode: 'HTML', ...this.getMainKeyboard(isAdmin) }
      );
    } catch (err) {
      console.error('Process login error:', err);
      ctx.reply('Tizimga kirishda xatolik yuz berdi. Qayta urinib ko‘ring.', this.getUnlinkedKeyboard());
    }
  }

  async init() {
    if (!this.token) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN topilmadi. Telegram bot faollashtirilmadi.');
      return;
    }

    try {
      this.bot = new Telegraf(this.token);

      // Global error handler to keep bot alive at all times
      this.bot.catch((err, ctx) => {
        console.error(`Telegram Bot xatosi (${ctx?.updateType || 'unknown'}):`, err.message);
      });

      // Fetch Bot Information
      this.botInfo = await this.bot.telegram.getMe();
      console.log(`🤖 Telegram Bot ulandi: @${this.botInfo.username} (${this.botInfo.first_name})`);

      // Set Chat Menu Button with Web App
      try {
        await this.bot.telegram.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: '🎂 Bol Tortlari App',
            web_app: { url: this.getWebAppUrl() },
          },
        });
      } catch (menuErr) {
        console.warn('Chat menu button set warning:', menuErr.message);
      }

      // Setup handlers
      this.setupHandlers();

      // Launch Bot polling
      this.bot
        .launch({
          dropPendingUpdates: true,
        })
        .then(() => {
          console.log('🚀 Telegram Bot polling muvaffaqiyatli ishga tushdi');
        })
        .catch((err) => {
          console.error('Telegram bot polling xatosi:', err.message);
        });

      // Graceful stop
      process.once('SIGINT', () => this.bot?.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
    } catch (err) {
      console.error('Telegram botni ishga tushirishda xatolik:', err.message);
    }
  }

  setupHandlers() {
    if (!this.bot) return;

    // 0. Middleware: Handle interactive login text input
    this.bot.on('text', async (ctx, next) => {
      const telegramId = ctx.from.id.toString();
      const text = ctx.message.text.trim();

      if (text === '❌ Bekor qilish' || text === '/cancel') {
        if (this.loginSessions.has(telegramId)) {
          this.loginSessions.delete(telegramId);
          const user = await this.getLinkedUser(telegramId);
          const isAdmin = await this.isUserAdmin(telegramId);
          return ctx.reply('Kirish jarayoni bekor qilindi.', user ? this.getMainKeyboard(isAdmin) : this.getUnlinkedKeyboard());
        }
      }

      if (this.loginSessions.has(telegramId)) {
        const session = this.loginSessions.get(telegramId);
        if (session.step === 'awaiting_login') {
          session.login = text;
          session.step = 'awaiting_password';
          return ctx.reply(
            `2️⃣ Endi hisobingiz <b>Paroli</b>ni kiriting:\n\n` +
            `<i>(Xavfsizlik maqsadida yuborgan xabaringiz o‘chirib yuboriladi)</i>\n\n` +
            `❌ Bekor qilish uchun /cancel deb yozing.`,
            {
              parse_mode: 'HTML',
              ...Markup.keyboard([['❌ Bekor qilish']]).resize(),
            }
          );
        }

        if (session.step === 'awaiting_password') {
          const password = text;
          const identifier = session.login;
          this.loginSessions.delete(telegramId);
          try {
            await ctx.deleteMessage(ctx.message.message_id);
          } catch (e) {}
          return this.processLogin(ctx, identifier, password);
        }
      }

      return next();
    });

    // 1. /start command (supports deep link: /start connect_<token>)
    this.bot.start(async (ctx) => {
      try {
        const payload = ctx.startPayload || '';
        const telegramId = ctx.from.id.toString();
        const userName = ctx.from.first_name || 'Hurmatli mijoz';

        // Deep linking account connection from website
        if (payload.startsWith('connect_')) {
          const token = payload.replace('connect_', '').trim();
          const user = await User.findOne({
            telegramLinkToken: token,
          });

          if (user) {
            user.telegramId = telegramId;
            user.telegramLinkToken = null;
            user.telegramLinkExpires = null;
            await user.save();

            // Realtime Socket.IO notification to user's web page
            socketService.emitTelegramLinked(user._id.toString(), {
              telegramId,
              username: ctx.from.username || null,
              firstName: ctx.from.first_name || '',
            });

            const userIsAdmin = ['super_admin', 'superadmin', 'admin'].includes(user.role) || telegramId === this.adminChatId;

            return ctx.reply(
              `🎉 <b>Tabriklaymiz, ${user.name}!</b>\n\n` +
                `Sizning saytdagi profilingiz (<code>${user.email}</code>) Telegram hisobingizga muvaffaqiyatli ulandi.\n\n` +
                `Endi siz:\n` +
                `• Sara tortlar katalogidan tanlashingiz;\n` +
                `• Buyurtmalaringiz holatini jonli kuzatishingiz;\n` +
                `• Sevimli tortlaringizni boshqarishingiz;\n` +
                `• Keshbek va maxsus takliflardan xabardor bo‘lishingiz mumkin!`,
              { parse_mode: 'HTML', ...this.getMainKeyboard(userIsAdmin) }
            );
          } else {
            return ctx.reply(
              `⚠️ <b>Bog‘lanish havolasi eskirgan yoki noto‘g‘ri.</b>\n\n` +
                `Iltimos, saytdagi profilingizga kirib, qaytadan "Telegramga ulash" tugmasini bosing yoki botda login qiling:\n` +
                `👉 ${this.clientUrl}/profile`,
              { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
            );
          }
        }

        // Regular greeting
        const user = await this.getLinkedUser(telegramId);
        const isAdmin = await this.isUserAdmin(telegramId);

        if (user) {
          return ctx.reply(
            `Assalomu alaykum, <b>${user.name}</b>!\n\n` +
              `🎂 <b>"Bol Tortlari"</b> rasmiy qandolat boti va servisiga xush kelibsiz.\n\n` +
              `Barcha xizmatlar va bo‘limlar siz uchun ochiq. Pastdagi menyudan kerakli bo‘limni tanlang:`,
            { parse_mode: 'HTML', ...this.getMainKeyboard(isAdmin) }
          );
        }

        // Not linked yet -> Gatekeeper greeting
        return ctx.reply(
          `Assalomu alaykum, <b>${userName}</b>!\n\n` +
            `🎂 <b>"Bol Tortlari"</b> rasmiy qandolat boti va servisiga xush kelibsiz.\n\n` +
            `🔒 <b>Xavfsizlik va shaxsiy buyurtmalar tizimi:</b>\n` +
            `Botdagi sara tortlar katalogi, shaxsiy buyurtmalarni kuzatish va keshbek tizimidan to‘liq foydalanish uchun hisobingizga kirishingiz lozim.\n\n` +
            `Quyidagi usullardan biri orqali hisobingizga kiring:\n` +
            `1️⃣ <b>🔑 Botda tizimga kirish:</b> Botning o‘zida Email/Username va parolingizni kiritish;\n` +
            `2️⃣ <b>🔗 Sayt orqali ulash:</b> Saytdagi profilingizdan bitta tugma orqali ulash;\n` +
            `3️⃣ <b>🚀 Web App:</b> Telegram ichida to‘liq Mini Appni ochish.`,
          { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
        );
      } catch (err) {
        console.error('Bot /start error:', err);
        ctx.reply('Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
      }
    });

    // 2. Login command & Button
    this.bot.hears(['🔑 Botda tizimga kirish', '/login'], async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const existingUser = await this.getLinkedUser(telegramId);
      if (existingUser) {
        const isAdmin = await this.isUserAdmin(telegramId);
        return ctx.reply(
          `ℹ️ Siz allaqachon <b>${existingUser.name}</b> (<code>${existingUser.email}</code>) hisobi bilan tizimdasiz.\n\n` +
          `Boshqa hisobga o‘tish uchun <b>/logout</b> yoki "🚪 Hisobdan chiqish" tugmasini bosing.`,
          { parse_mode: 'HTML', ...this.getMainKeyboard(isAdmin) }
        );
      }

      this.loginSessions.set(telegramId, { step: 'awaiting_login', startedAt: Date.now() });

      return ctx.reply(
        `🔑 <b>"Bol Tortlari" hisobiga kirish:</b>\n\n` +
        `1️⃣ Saytdagi <b>Email</b> yoki <b>Username</b>ingizni kiriting:\n` +
        `<i>(Masalan: <code>eabdurashid72@gmail.com</code> yoki <code>evil</code>)</i>\n\n` +
        `❌ Bekor qilish uchun <code>/cancel</code> deb yozing.`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['❌ Bekor qilish']]).resize(),
        }
      );
    });

    // Direct command login: /login <identifier> <password>
    this.bot.command('login', async (ctx) => {
      const parts = ctx.message.text.trim().split(/\s+/);
      if (parts.length >= 3) {
        const identifier = parts[1];
        const password = parts.slice(2).join(' ');
        try { await ctx.deleteMessage(ctx.message.message_id); } catch (e) {}
        return this.processLogin(ctx, identifier, password);
      }
    });

    // 3. Logout
    this.bot.hears(['🚪 Hisobdan chiqish', '/logout'], async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const user = await User.findOne({ telegramId });
      if (user) {
        user.telegramId = null;
        user.telegramLinkToken = null;
        user.telegramLinkExpires = null;
        await user.save();
      }
      this.loginSessions.delete(telegramId);
      return ctx.reply(
        `👋 <b>Hisobingizdan muvaffaqiyatli chiqdingiz.</b>\n\n` +
        `Botdan foydalanish uchun istalgan vaqtda qaytadan tizimga kirishingiz mumkin.`,
        { parse_mode: 'HTML', ...this.getUnlinkedKeyboard() }
      );
    });

    // 4. Link via website instructions
    this.bot.hears(['🔗 Sayt orqali ulash', '/link'], async (ctx) => {
      return ctx.reply(
        `🔗 <b>Sayt orqali hisobni ulash tartibi:</b>\n\n` +
        `1. Saytimizga kiring: 👉 ${this.clientUrl}/profile\n` +
        `2. Profilingizdan <b>"Telegramga ulash"</b> tugmasini bosing.\n` +
        `3. Ochilgan oynadagi <b>"Telegram orqali ochish va ulash"</b> tugmasini bossangiz, profilingiz shu zahotiyoq avtomatik biriktiriladi!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🌐 Saytdagi profilga o‘tish', `${this.clientUrl}/profile`)],
          ]),
        }
      );
    });

    // 5. Web App info / launch
    this.bot.hears(['🚀 Web App', '/webapp', '🚀 Web App (Mini App)', '🚀 Web App (Mini Ilova)'], async (ctx) => {
      return ctx.reply(
        `🍰 <b>"Bol Tortlari" — Telegram Mini App (Web App):</b>\n\n` +
        `Saytning to‘liq interfeysini Telegramdan chiqmasdan turib ishlatishingiz mumkin!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('🚀 Web Appni ochish', this.getWebAppUrl())],
          ]),
        }
      );
    });

    // 6. 🎂 Tortlar Katalogi & Bo'limlar
    this.bot.hears(['🎂 Tortlar Katalogi', '🎂 Katalog & Buyurtma', '/catalog'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const categories = await Category.find({ isActive: true });

        const buttons = [];
        buttons.push([Markup.button.callback('✨ Barcha sara tortlar', 'cat:all:0')]);

        // Group categories 2 per row
        for (let i = 0; i < categories.length; i += 2) {
          const row = [];
          row.push(Markup.button.callback(categories[i].name_uz, `cat:${categories[i].slug}:0`));
          if (categories[i + 1]) {
            row.push(Markup.button.callback(categories[i + 1].name_uz, `cat:${categories[i + 1].slug}:0`));
          }
          buttons.push(row);
        }

        return ctx.reply(
          `🎂 <b>"Bol Tortlari" Qandolat Katalogi:</b>\n\n` +
            `Tabiiy sariyog‘, sifatli shokolad va yangi mevalardan tayyorlangan betakror shirinliklarimiz.\n\n` +
            `Quyidagi toifalardan birini tanlang yoki saytimiz orqali ko‘ring:\n` +
            `👉 ${this.clientUrl}/cakes`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons),
          }
        );
      } catch (err) {
        console.error('Bot catalog error:', err);
        ctx.reply('Katalogni yuklashda xatolik yuz berdi.');
      }
    });

    // Category Pagination & Cake Viewer: cat:<slug>:<index>
    this.bot.action(/^cat:(.+):(\d+)$/, async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const slug = ctx.match[1];
        let index = parseInt(ctx.match[2], 10) || 0;

        const filter = { isActive: { $ne: false } };
        if (slug !== 'all') {
          filter.category_slug = slug;
        }

        const cakes = await Cake.find(filter);

        if (!cakes || cakes.length === 0) {
          return ctx.answerCbQuery('Bu bo‘limda hozircha tortlar mavjud emas.', { show_alert: true });
        }

        if (index >= cakes.length) index = 0;
        if (index < 0) index = cakes.length - 1;

        const cake = cakes[index];
        const cakeId = cake._id ? cake._id.toString() : cake.id;

        const isFav = Array.isArray(user.favorites) && user.favorites.some((f) => f.toString() === cakeId);

        const caption =
          `🎂 <b>${cake.name}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Bo‘lim:</b> ${cake.category_name || 'Premium'}\n` +
          `⚖️ <b>Vazni:</b> ${cake.weight || '1.5 kg'}\n` +
          `💰 <b>Narxi:</b> <b>${(cake.price || 0).toLocaleString()} so‘m</b>\n` +
          (cake.is_popular ? `🔥 <i>Xit mahsulot / Eng ko‘p sotilgan</i>\n` : '') +
          `\n📝 <i>${cake.description || 'Premium tabiiy masalliqlardan tayyorlangan betakror bayram shirinligi.'}</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Mahsulot ${index + 1} / ${cakes.length}\n` +
          `🌐 Saytda to‘liq ko‘rish: ${this.clientUrl}/cakes/${cakeId}`;

        const navRow = [];
        if (cakes.length > 1) {
          navRow.push(Markup.button.callback('⬅️ Oldingi', `cat:${slug}:${index - 1}`));
          navRow.push(Markup.button.callback(`${index + 1}/${cakes.length}`, 'noop'));
          navRow.push(Markup.button.callback('Keyingi ➡️', `cat:${slug}:${index + 1}`));
        }

        const actionRow = [
          Markup.button.callback(isFav ? '❤️ Sevimlilarda bor' : '🤍 Sevimlilarga qo‘shish', `fav_toggle:${cakeId}:${slug}:${index}`),
        ];

        const inlineButtons = [actionRow];
        if (navRow.length) inlineButtons.push(navRow);
        inlineButtons.push([Markup.button.callback('🔙 Barcha bo‘limlar', 'show_categories')]);

        await ctx.answerCbQuery();

        try {
          await ctx.editMessageText(caption, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(inlineButtons),
          });
        } catch (e) {
          await ctx.reply(caption, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(inlineButtons),
          });
        }
      } catch (err) {
        console.error('Category action error:', err);
        ctx.answerCbQuery('Xatolik yuz berdi.');
      }
    });

    this.bot.action('show_categories', async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const categories = await Category.find({ isActive: true });
        const buttons = [];
        buttons.push([Markup.button.callback('✨ Barcha sara tortlar', 'cat:all:0')]);

        for (let i = 0; i < categories.length; i += 2) {
          const row = [];
          row.push(Markup.button.callback(categories[i].name_uz, `cat:${categories[i].slug}:0`));
          if (categories[i + 1]) {
            row.push(Markup.button.callback(categories[i + 1].name_uz, `cat:${categories[i + 1].slug}:0`));
          }
          buttons.push(row);
        }

        await ctx.answerCbQuery();
        await ctx.editMessageText(
          `🎂 <b>"Bol Tortlari" Qandolat Katalogi:</b>\n\n` +
            `Quyidagi toifalardan birini tanlang:\n` +
            `👉 ${this.clientUrl}/cakes`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons),
          }
        );
      } catch (err) {
        ctx.answerCbQuery();
      }
    });

    this.bot.action('noop', (ctx) => ctx.answerCbQuery());

    // Toggle Favorite from Bot: fav_toggle:<cakeId>:<slug>:<index>
    this.bot.action(/^fav_toggle:(.+):(.+):(\d+)$/, async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const cakeId = ctx.match[1];
        const slug = ctx.match[2];
        const index = ctx.match[3];

        if (!Array.isArray(user.favorites)) {
          user.favorites = [];
        }

        const favIndex = user.favorites.findIndex((f) => f.toString() === cakeId);
        let added = false;
        if (favIndex > -1) {
          user.favorites.splice(favIndex, 1);
          added = false;
        } else {
          user.favorites.push(cakeId);
          added = true;
        }

        await user.save();
        await ctx.answerCbQuery(added ? '❤️ Sevimlilar ro‘yxatiga qo‘shildi!' : 'Olib tashlandi.');

        // Refresh cake view
        const cakes = await Cake.find(slug === 'all' ? { isActive: { $ne: false } } : { category_slug: slug, isActive: { $ne: false } });
        const idx = Math.min(parseInt(index, 10), cakes.length - 1);
        const cake = cakes[idx];
        if (!cake) return;

        const caption =
          `🎂 <b>${cake.name}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Bo‘lim:</b> ${cake.category_name || 'Premium'}\n` +
          `⚖️ <b>Vazni:</b> ${cake.weight || '1.5 kg'}\n` +
          `💰 <b>Narxi:</b> <b>${(cake.price || 0).toLocaleString()} so‘m</b>\n` +
          (cake.is_popular ? `🔥 <i>Xit mahsulot / Eng ko‘p sotilgan</i>\n` : '') +
          `\n📝 <i>${cake.description || 'Premium tabiiy masalliqlardan tayyorlangan betakror bayram shirinligi.'}</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Mahsulot ${idx + 1} / ${cakes.length}\n` +
          `🌐 Saytda to‘liq ko‘rish: ${this.clientUrl}/cakes/${cakeId}`;

        const navRow = [];
        if (cakes.length > 1) {
          navRow.push(Markup.button.callback('⬅️ Oldingi', `cat:${slug}:${idx - 1}`));
          navRow.push(Markup.button.callback(`${idx + 1}/${cakes.length}`, 'noop'));
          navRow.push(Markup.button.callback('Keyingi ➡️', `cat:${slug}:${idx + 1}`));
        }

        const actionRow = [
          Markup.button.callback(added ? '❤️ Sevimlilarda bor' : '🤍 Sevimlilarga qo‘shish', `fav_toggle:${cakeId}:${slug}:${idx}`),
        ];

        const inlineButtons = [actionRow];
        if (navRow.length) inlineButtons.push(navRow);
        inlineButtons.push([Markup.button.callback('🔙 Barcha bo‘limlar', 'show_categories')]);

        await ctx.editMessageText(caption, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(inlineButtons),
        });
      } catch (err) {
        console.error('Fav toggle error:', err);
        ctx.answerCbQuery('Xatolik.');
      }
    });

    // 7. 📦 Buyurtmalarim (My Orders)
    this.bot.hears(['📦 Buyurtmalarim', '/orders'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const orders = await Order.find({ customer: user._id })
          .sort({ createdAt: -1 })
          .limit(5);

        if (!orders || orders.length === 0) {
          const inline = this.getInlineWebButton('🎂 Katalogga o‘tish', '/cakes');
          return ctx.reply(
            `📦 <b>Sizda hali buyurtmalar mavjud emas.</b>\n\n` +
              `Yangi bayram shirinliklariga buyurtma berish uchun saytimizga tashrif buyuring:\n` +
              `👉 ${this.clientUrl}/cakes`,
            {
              parse_mode: 'HTML',
              ...(inline || {}),
            }
          );
        }

        let message = `📦 <b>Sizning so‘nggi buyurtmalaringiz:</b>\n\n`;
        orders.forEach((ord, index) => {
          const statusText = STATUS_LABELS[ord.status] || ord.status;
          const dateStr = new Date(ord.createdAt).toLocaleDateString('uz-UZ', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const itemCount = ord.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1;

          message += `<b>${index + 1}. #${ord.orderId}</b> — ${statusText}\n`;
          message += `   📅 Sana: ${dateStr}\n`;
          message += `   🧁 Mahsulotlar: ${itemCount} ta\n`;
          message += `   💰 Summa: <b>${(ord.total || 0).toLocaleString()} so‘m</b>\n`;
          message += `   📍 Manzil: ${ord.customer_address || '-'}\n\n`;
        });

        message += `Batafsil ma'lumot va jonli kuzatuv uchun:\n👉 ${this.clientUrl}/orders`;

        const inline = this.getInlineWebButton('⚡ Buyurtmalarni jonli kuzatish', '/orders');

        return ctx.reply(message, {
          parse_mode: 'HTML',
          ...(inline || {}),
        });
      } catch (err) {
        console.error('Bot orders error:', err);
        ctx.reply('Buyurtmalarni yuklashda xatolik yuz berdi.');
      }
    });

    // 8. ❤️ Sevimlilar (Favorites / Wishlist)
    this.bot.hears(['❤️ Sevimlilar', '/favorites'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        if (user && typeof user.populate === 'function') {
          await user.populate('favorites');
        }

        const favorites = (user.favorites || []).filter(Boolean);
        if (favorites.length === 0) {
          const inline = this.getInlineWebButton('🎂 Katalogni ko‘rish', '/cakes');
          return ctx.reply(
            `❤️ <b>Sizning sevimlilar ro‘yxatingiz bo‘sh.</b>\n\n` +
              `Katalogimizdagi tortlarga ❤️ Like belgisini bosib o‘zingizga yoqqanlarini saqlab boring!\n` +
              `👉 ${this.clientUrl}/cakes`,
            {
              parse_mode: 'HTML',
              ...(inline || {}),
            }
          );
        }

        let message = `❤️ <b>Siz yoqtirgan tortlar (${favorites.length} ta):</b>\n\n`;
        favorites.slice(0, 10).forEach((cake, idx) => {
          message += `<b>${idx + 1}. ${cake.name}</b>\n`;
          message += `   💰 Narxi: <b>${(cake.price || 0).toLocaleString()} so‘m</b>\n`;
          if (cake.category_name || cake.categoryName) {
            message += `   🏷️ Bo‘lim: ${cake.category_name || cake.categoryName}\n`;
          }
          message += `\n`;
        });

        message += `Sevimlilaringizni savatga qo‘shish va buyurtma qilish uchun:\n👉 ${this.clientUrl}/favorites`;

        const inline = this.getInlineWebButton('❤️ Sevimlilar sahifasiga o‘tish', '/favorites');

        return ctx.reply(message, {
          parse_mode: 'HTML',
          ...(inline || {}),
        });
      } catch (err) {
        console.error('Bot favorites error:', err);
        ctx.reply('Sevimlilarni yuklashda xatolik yuz berdi.');
      }
    });

    // 9. 💰 Hamyon & Keshbek
    this.bot.hears(['💰 Hamyon & Keshbek', '/wallet'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const settings = (await Settings.findOne()) || { cashbackPercent: 3 };
        const cashbackPercent = settings.cashbackPercent || 3;

        const inline = this.getInlineWebButton('💳 Hamyonni boshqarish', '/profile');

        return ctx.reply(
          `💰 <b>Sizning shaxsiy hamyoningiz:</b>\n\n` +
            `👤 <b>Mijoz:</b> ${user.name} (@${user.username || 'username_yoq'})\n` +
            `💳 <b>Mavjud balans:</b> <code>${(user.walletBalance || 0).toLocaleString()} so‘m</code>\n` +
            `🎁 <b>Keshbek stavkasi:</b> <code>${cashbackPercent}%</code>\n\n` +
            `Hamyondagi mablag‘ingizdan istalgan vaqtda keyingi shirinlik xaridlarida to‘liq foydalanishingiz mumkin!\n` +
            `👉 ${this.clientUrl}/profile`,
          {
            parse_mode: 'HTML',
            ...(inline || {}),
          }
        );
      } catch (err) {
        console.error('Bot wallet error:', err);
        ctx.reply('Hamyon ma’lumotlarini olishda xatolik yuz berdi.');
      }
    });

    // 10. 👤 Shaxsiy Profil
    this.bot.hears(['👤 Shaxsiy Profil', '/profile'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        return ctx.reply(
          `👤 <b>Shaxsiy Kabinet Ma'lumotlari:</b>\n\n` +
            `• <b>Ism:</b> ${user.name}\n` +
            `• <b>Username:</b> @${user.username || 'yo‘q'}\n` +
            `• <b>Email:</b> <code>${user.email}</code>\n` +
            `• <b>Telefon:</b> ${user.phone || 'Kiritilmagan'}\n` +
            `• <b>Rol:</b> <code>${user.role}</code>\n` +
            `• <b>Hamyon:</b> ${(user.walletBalance || 0).toLocaleString()} so‘m\n` +
            `• <b>Telegram:</b> Ulangan ✅\n\n` +
            `Saytda to‘liq sozlamalar va manzillar kitobchasi:\n👉 ${this.clientUrl}/profile`,
          { parse_mode: 'HTML' }
        );
      } catch (err) {
        ctx.reply('Profil ma’lumotlarini olishda xatolik yuz berdi.');
      }
    });

    // 11. 📞 Aloqa & Manzil (Available for everyone)
    this.bot.hears(['📞 Aloqa & Manzil', '/contact', '📞 Aloqa & Yordam'], async (ctx) => {
      try {
        const settings = await Settings.findOne();
        const phone = settings?.contactPhone || '+998 (90) 123-45-67';
        const telegram = settings?.contactTelegram || '@boltortlari_admin';
        const address = settings?.contactAddress || 'Toshkent sh., Navoiy ko‘chasi 14';
        const hours = settings?.workingHours || '09:00 - 21:00';

        return ctx.reply(
          `📞 <b>"Bol Tortlari" Aloqa Markazi:</b>\n\n` +
            `📍 <b>Manzil:</b> ${address}\n` +
            `⏰ <b>Ish vaqti:</b> ${hours} (Dam olish kunlarisiz)\n` +
            `📱 <b>Telefon:</b> ${phone}\n` +
            `✈️ <b>Telegram operator:</b> ${telegram}\n\n` +
            `Har qanday taklif yoki maxsus buyurtmalar bo‘yicha bemalol bog‘lanishingiz mumkin!`,
          { parse_mode: 'HTML' }
        );
      } catch (err) {
        ctx.reply('Aloqa ma’lumotlarini olishda xatolik yuz berdi.');
      }
    });

    // 12. ⚙️ Admin Paneli (Telegramda)
    this.bot.hears(['⚙️ Admin Paneli', '/admin'], async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const telegramId = ctx.from.id.toString();
        const isAdmin = await this.isUserAdmin(telegramId);

        if (!isAdmin) {
          return ctx.reply('⛔ Kechirasiz, sizda administrator huquqlari yo‘q.');
        }

        // Fetch Live Stats from Database
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayOrders = await Order.find({
          createdAt: { $gte: todayStart },
          status: { $ne: 'cancelled' },
        });

        const todayRevenue = todayOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

        const activeCount = await Order.countDocuments({
          status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way'] },
        });

        const usersCount = await User.countDocuments();
        const settings = (await Settings.findOne()) || { isStoreOpen: true };

        const adminMessage =
          `⚙️ <b>BOL TORTLARI — ADMIN BOSHQARUV PORTALI</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏬 <b>Do‘kon holati:</b> ${settings.isStoreOpen ? '🟢 OCHIQ' : '🔴 YOPIQ'}\n` +
          `💰 <b>Bugungi tushum:</b> <b>${todayRevenue.toLocaleString()} so‘m</b> (${todayOrders.length} ta buyurtma)\n` +
          `⚡ <b>Faol buyurtmalar:</b> <b>${activeCount} ta</b>\n` +
          `👥 <b>Jami mijozlar:</b> ${usersCount} ta\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Quyidagi tugmalar orqali boshqaring yoki sayt admin paneliga kiring:\n` +
          `🌐 ${this.clientUrl}/admin`;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(`📦 Faol buyurtmalar (${activeCount})`, 'adm_active_orders')],
          [
            Markup.button.callback(
              settings.isStoreOpen ? '🔴 Do‘konni yopish' : '🟢 Do‘konni ochish',
              'adm_toggle_store'
            ),
          ],
          [Markup.button.callback('🔄 Yangilash', 'adm_refresh_stats')],
        ]);

        return ctx.reply(adminMessage, {
          parse_mode: 'HTML',
          ...keyboard,
        });
      } catch (err) {
        console.error('Admin panel command error:', err);
        ctx.reply('Admin panelni yuklashda xatolik.');
      }
    });

    // Admin Toggle Store Action
    this.bot.action('adm_toggle_store', async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const telegramId = ctx.from.id.toString();
        const isAdmin = await this.isUserAdmin(telegramId);
        if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');

        let settings = await Settings.findOne();
        if (!settings) {
          settings = new Settings();
        }

        settings.isStoreOpen = !settings.isStoreOpen;
        await settings.save();

        await ctx.answerCbQuery(
          settings.isStoreOpen ? '🟢 Do‘kon ochildi!' : '🔴 Do‘kon vaqtincha yopildi!',
          { show_alert: true }
        );

        return this.sendRefreshedAdminStats(ctx);
      } catch (err) {
        console.error('Admin toggle store error:', err);
        ctx.answerCbQuery('Xatolik.');
      }
    });

    // Admin Refresh Stats Action
    this.bot.action('adm_refresh_stats', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;
      await ctx.answerCbQuery('Yangilandi 🔄');
      return this.sendRefreshedAdminStats(ctx);
    });

    // Admin Active Orders Action
    this.bot.action('adm_active_orders', async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const telegramId = ctx.from.id.toString();
        const isAdmin = await this.isUserAdmin(telegramId);
        if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');

        const activeOrders = await Order.find({
          status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way'] },
        })
          .sort({ createdAt: -1 })
          .limit(5);

        if (!activeOrders || activeOrders.length === 0) {
          return ctx.answerCbQuery('Hozirda faol buyurtmalar mavjud emas.', { show_alert: true });
        }

        await ctx.answerCbQuery();

        for (const ord of activeOrders) {
          const statusText = STATUS_LABELS[ord.status] || ord.status;
          const msg =
            `📦 <b>Buyurtma #${ord.orderId}</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 Mijoz: <b>${ord.customer_name}</b> (<code>${ord.customer_phone}</code>)\n` +
            `📍 Manzil: ${ord.customer_address}\n` +
            `💰 Summa: <b>${(ord.total || 0).toLocaleString()} so‘m</b> (${ord.payment_method})\n` +
            `Holat: <b>${statusText}</b>\n` +
            (ord.notes ? `Izoh: <i>${ord.notes}</i>\n` : '');

          const keyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Qabul', `ord_status:${ord.orderId}:confirmed`),
              Markup.button.callback('👨‍🍳 Oshxona', `ord_status:${ord.orderId}:preparing`),
            ],
            [
              Markup.button.callback('🛵 Kuryerda', `ord_status:${ord.orderId}:on_the_way`),
              Markup.button.callback('🎉 Yetkazildi', `ord_status:${ord.orderId}:delivered`),
            ],
            [Markup.button.callback('❌ Bekor qilish', `ord_status:${ord.orderId}:cancelled`)],
          ]);

          await ctx.reply(msg, { parse_mode: 'HTML', ...keyboard });
        }
      } catch (err) {
        console.error('Admin active orders error:', err);
        ctx.answerCbQuery('Xatolik.');
      }
    });

    // Admin Inline Button Callback: ord_status:<orderId>:<status>
    this.bot.action(/^ord_status:(.+):(.+)$/, async (ctx) => {
      try {
        const user = await this.requireAuth(ctx);
        if (!user) return;

        const orderId = ctx.match[1];
        const newStatus = ctx.match[2];
        const senderId = ctx.from.id.toString();

        const isAdmin = await this.isUserAdmin(senderId);
        if (!isAdmin) {
          return ctx.answerCbQuery('⛔ Sizda buyurtma statusini o‘zgartirish huquqi yo‘q.', { show_alert: true });
        }

        const order = await findOrderSafely(orderId);
        if (!order) {
          return ctx.answerCbQuery('⚠️ Buyurtma topilmadi.', { show_alert: true });
        }

        if (order.status === newStatus) {
          return ctx.answerCbQuery(`Buyurtma allaqachon "${STATUS_LABELS[newStatus] || newStatus}" holatida.`);
        }

        order.status = newStatus;
        if (!Array.isArray(order.status_history)) {
          order.status_history = [];
        }
        order.status_history.push({
          status: newStatus,
          timestamp: new Date(),
          changedBy: `Telegram Admin (@${ctx.from.username || ctx.from.first_name})`,
        });

        await order.save();

        // If marked delivered, trigger complete delivery sequence
        if (newStatus === 'delivered') {
          const { orderController } = await import('../controllers/orderController.js');
          if (orderController && orderController.handleOrderDeliveryCompletion) {
            await orderController.handleOrderDeliveryCompletion(order, 'Telegram Admin');
          }
        } else {
          socketService.emitOrderStatus(order);
        }

        // Notify customer on Telegram if linked
        await this.notifyCustomerOrderStatus(order);

        await ctx.answerCbQuery(`✅ #${order.orderId} statusi: ${STATUS_LABELS[newStatus] || newStatus}`);

        // Update admin message markup
        try {
          await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  newStatus === 'confirmed' ? '✅ Qabul qilindi' : 'Qabul qilish',
                  `ord_status:${order.orderId}:confirmed`
                ),
                Markup.button.callback(
                  newStatus === 'preparing' ? '👨‍🍳 Tayyorlanmoqda' : 'Tayyorlash',
                  `ord_status:${order.orderId}:preparing`
                ),
              ],
              [
                Markup.button.callback(
                  newStatus === 'on_the_way' ? '🛵 Yo‘lda' : 'Kuryerga berish',
                  `ord_status:${order.orderId}:on_the_way`
                ),
                Markup.button.callback(
                  newStatus === 'delivered' ? '🎉 Yetkazildi' : 'Yetkazildi',
                  `ord_status:${order.orderId}:delivered`
                ),
              ],
              [
                Markup.button.callback(
                  newStatus === 'cancelled' ? '❌ Bekor qilingan' : 'Bekor qilish',
                  `ord_status:${order.orderId}:cancelled`
                ),
              ],
            ]).reply_markup
          );
        } catch (editErr) {}
      } catch (err) {
        console.error('Bot action error:', err);
        ctx.answerCbQuery('Xatolik yuz berdi.', { show_alert: true });
      }
    });
  }

  async sendRefreshedAdminStats(ctx) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayOrders = await Order.find({
        createdAt: { $gte: todayStart },
        status: { $ne: 'cancelled' },
      });

      const todayRevenue = todayOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

      const activeCount = await Order.countDocuments({
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way'] },
      });

      const usersCount = await User.countDocuments();
      const settings = (await Settings.findOne()) || { isStoreOpen: true };

      const adminMessage =
        `⚙️ <b>BOL TORTLARI — ADMIN BOSHQARUV PORTALI</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏬 <b>Do‘kon holati:</b> ${settings.isStoreOpen ? '🟢 OCHIQ' : '🔴 YOPIQ'}\n` +
        `💰 <b>Bugungi tushum:</b> <b>${todayRevenue.toLocaleString()} so‘m</b> (${todayOrders.length} ta buyurtma)\n` +
        `⚡ <b>Faol buyurtmalar:</b> <b>${activeCount} ta</b>\n` +
        `👥 <b>Jami mijozlar:</b> ${usersCount} ta\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Quyidagi tugmalar orqali boshqaring yoki sayt admin paneliga kiring:\n` +
        `🌐 ${this.clientUrl}/admin`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(`📦 Faol buyurtmalar (${activeCount})`, 'adm_active_orders')],
        [
          Markup.button.callback(
            settings.isStoreOpen ? '🔴 Do‘konni yopish' : '🟢 Do‘konni ochish',
            'adm_toggle_store'
          ),
        ],
        [Markup.button.callback('🔄 Yangilash', 'adm_refresh_stats')],
      ]);

      await ctx.editMessageText(adminMessage, {
        parse_mode: 'HTML',
        ...keyboard,
      });
    } catch (e) {}
  }

  /**
   * Admin Notification: Send new order alert with interactive action buttons to Admin Telegram ID
   */
  async notifyNewOrder(order) {
    if (!this.bot || !this.adminChatId) return;

    try {
      let itemsList = '';
      if (Array.isArray(order.items)) {
        order.items.forEach((it, idx) => {
          const qty = it.quantity || 1;
          const price = (it.price || 0) * qty;
          itemsList += `${idx + 1}. <b>${it.name}</b> (${it.weight || it.size || 'Standart'}) x ${qty} — ${price.toLocaleString()} so‘m\n`;
          if (it.customInscription) {
            itemsList += `   ✍️ <i>Yozuv: "${it.customInscription}"</i>\n`;
          }
        });
      }

      const paymentMethodNames = {
        cash: 'Naqd pul',
        card: 'Bank kartasi',
        payme: 'Payme',
        click: 'Click',
        wallet: 'Hamyon',
      };
      const paymentStatusNames = {
        pending: '🟡 To‘lov kutilmoqda',
        paid: '🟢 To‘langan',
        failed: '🔴 Bekor',
      };

      const message =
        `🎂 <b>YANGI BUYURTMA #${order.orderId}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Mijoz:</b> ${order.customer_name}\n` +
        `📞 <b>Telefon:</b> <code>${order.customer_phone}</code>\n` +
        `📍 <b>Manzil:</b> ${order.customer_address}\n` +
        `💰 <b>Jami summa:</b> <b>${(order.total || 0).toLocaleString()} so‘m</b>\n` +
        `💳 <b>To‘lov usuli:</b> ${paymentMethodNames[order.payment_method] || order.payment_method} (${paymentStatusNames[order.payment_status] || order.payment_status})\n` +
        (order.notes ? `📝 <b>Izoh:</b> <i>${order.notes}</i>\n` : '') +
        `\n🧁 <b>Mahsulotlar ro‘yxati:</b>\n${itemsList || 'Standart mahsulot'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Holatni o‘zgartirish uchun quyidagi tugmalarni bosing:`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Qabul qilish', `ord_status:${order.orderId}:confirmed`),
          Markup.button.callback('👨‍🍳 Tayyorlanmoqda', `ord_status:${order.orderId}:preparing`),
        ],
        [
          Markup.button.callback('🛵 Kuryerga berildi', `ord_status:${order.orderId}:on_the_way`),
          Markup.button.callback('🎉 Yetkazildi', `ord_status:${order.orderId}:delivered`),
        ],
        [
          Markup.button.callback('❌ Bekor qilish', `ord_status:${order.orderId}:cancelled`),
        ],
      ]);

      await this.bot.telegram.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML',
        ...keyboard,
      });
      console.log(`✉️ Admin Telegramga yangi buyurtma yuborildi: #${order.orderId}`);
    } catch (err) {
      console.error('Telegram admin bildirishnomasini yuborishda xatolik:', err.message);
    }
  }

  /**
   * Customer Notification: Notify customer on Telegram if they linked their account
   */
  async notifyCustomerOrderStatus(order) {
    if (!this.bot || !order) return;

    try {
      let customer = null;
      if (order.customer) {
        customer = await User.findById(order.customer);
      }

      const telegramId = customer?.telegramId;
      if (!telegramId) {
        return; // Customer has not connected Telegram
      }

      const statusMessages = {
        confirmed: '✅ <b>Buyurtmangiz tasdiqlandi!</b>\nQandolatchilarimiz tez orada tayyorlashga kirishadilar.',
        preparing: '👨‍🍳 <b>Buyurtmangiz tayyorlanmoqda!</b>\nSiz uchun eng toza va sifatli masalliqlardan shirinlik pishirilmoqda.',
        ready: '🧁 <b>Buyurtmangiz tayyor bo‘ldi!</b>\nQadoqlanib, yetkazib berish bo‘limiga yo‘naltirildi.',
        delivering: '🛵 <b>Buyurtmangiz kuryerda va yo‘lga chiqdi!</b>\nTez orada kuryerimiz ko‘rsatilgan manzilga yetib boradi.',
        on_the_way: '🛵 <b>Buyurtmangiz kuryerda va yo‘lga chiqdi!</b>\nTez orada kuryerimiz ko‘rsatilgan manzilga yetib boradi.',
        delivered: '🎉 <b>Buyurtmangiz yetkazib berildi!</b>\nBayramingiz shirin va unutilmas o‘tsin. Mahsulot va xizmat sifatini saytimizda baholab fikr qoldirishni unutmang!',
        cancelled: '❌ <b>Buyurtmangiz bekor qilindi.</b>\nSavollaringiz bo‘lsa, biz bilan bog‘laning.',
      };

      const customMsg = statusMessages[order.status] || `Holat: ${STATUS_LABELS[order.status] || order.status}`;

      const text =
        `📦 <b>Buyurtmangiz holati yangilandi!</b>\n\n` +
        `Buyurtma raqami: <b>#${order.orderId}</b>\n` +
        `Joriy holat: <b>${STATUS_LABELS[order.status] || order.status}</b>\n\n` +
        `${customMsg}\n\n` +
        `💰 Jami: <b>${(order.total || 0).toLocaleString()} so‘m</b>\n` +
        `📍 Manzil: ${order.customer_address}\n\n` +
        `🌐 Kuzatish: ${this.clientUrl}/orders`;

      const inline = this.getInlineWebButton('⚡ Saytda kuzatish', '/orders');

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...(inline || {}),
      });

      console.log(`✉️ Xaridor Telegramiga (#${order.orderId}) xabar yetkazildi (ID: ${telegramId})`);
    } catch (err) {
      console.error('Xaridorga Telegram xabari yuborishda xatolik:', err.message);
    }
  }
}

export const telegramBotService = new TelegramBotService();
