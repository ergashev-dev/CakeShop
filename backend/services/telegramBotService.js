import { Telegraf, Markup } from 'telegraf';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cake from '../models/Cake.js';
import Category from '../models/Category.js';
import Settings from '../models/Settings.js';
import { socketService } from './socketService.js';
import { aiService } from './aiService.js';

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
    this.clientUrl = process.env.CLIENT_URL || 'https://boltortlar.uz';
    this.defaultWebAppUrl = 'https://boltortlar.uz';
    this.adminSessions = new Map(); // telegramId -> { step, data }
    this.loginSessions = new Map(); // telegramId -> { step, login }
  }

  getWebAppUrl() {
    if (process.env.TELEGRAM_WEBAPP_URL) return process.env.TELEGRAM_WEBAPP_URL;
    if (this.clientUrl && this.clientUrl.startsWith('https://')) return this.clientUrl;
    return this.defaultWebAppUrl;
  }

  async isUserAdmin(telegramId) {
    if (!telegramId) return false;
    if (telegramId.toString() === this.adminChatId.toString()) return true;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    return Boolean(user && ['super_admin', 'superadmin', 'admin'].includes(user.role));
  }

  async getLinkedUser(telegramId) {
    if (!telegramId) return null;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    if (user && !user.isBlocked) {
      return user;
    }
    return null;
  }

  /**
   * Check mandatory channel subscription
   * Returns true if user is subscribed or check is disabled
   */
  async checkChannelSubscription(ctx, telegramId) {
    try {
      const isAdmin = await this.isUserAdmin(telegramId);
      if (isAdmin) return true;

      const settings = await Settings.findOne();
      if (!settings || !settings.isMandatorySubEnabled || !settings.mandatoryChannel) {
        return true;
      }

      const channel = settings.mandatoryChannel.trim();
      if (!channel) return true;

      const chatMember = await ctx.telegram.getChatMember(channel, Number(telegramId));
      const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
      if (validStatuses.includes(chatMember.status)) {
        return true;
      }

      const channelUsername = channel.startsWith('@') ? channel.substring(1) : channel;
      const channelLink = `https://t.me/${channelUsername}`;

      await ctx.reply(
        `📢 <b>Hurmatli foydalanuvchi!</b>\n\n` +
          `Botdan foydalanish va buyurtma berish uchun rasmiy kanalimizga a’zo bo‘ling:\n` +
          `👉 <b>${channel}</b>\n\n` +
          `Kanalga obuna bo‘lgach, pastdagi «✅ Obunani tekshirish» tugmasini bosing:`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.url('➕ Kanalga a’zo bo‘lish', channelLink)],
            [Markup.button.callback('✅ Obunani tekshirish', 'check_subscription')],
          ]),
        }
      );
      return false;
    } catch (err) {
      console.warn('Channel sub check warning:', err.message);
      // Fail-open so users aren't blocked if bot has insufficient channel admin rights
      return true;
    }
  }

  getMainKeyboard(isAdmin = false) {
    const webAppBtn = Markup.button.webApp('🛍️ Web App orqali buyurtma', this.getWebAppUrl());

    if (isAdmin) {
      return Markup.keyboard([
        [webAppBtn],
        ['📦 Buyurtmalarim', 'ℹ️ Biz haqimizda & Aloqa'],
        ['⚙️ Admin Paneli'],
      ]).resize();
    }

    return Markup.keyboard([
      [webAppBtn],
      ['📦 Buyurtmalarim', 'ℹ️ Biz haqimizda & Aloqa'],
    ]).resize();
  }

  async init() {
    if (!this.token) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN topilmadi. Telegram bot faollashtirilmadi.');
      return;
    }

    try {
      this.bot = new Telegraf(this.token);

      this.bot.catch((err, ctx) => {
        console.error(`Telegram Bot xatosi (${ctx?.updateType || 'unknown'}):`, err.message);
      });

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

      process.once('SIGINT', () => this.bot?.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
    } catch (err) {
      console.error('Telegram botni ishga tushirishda xatolik:', err.message);
    }
  }

  setupHandlers() {
    if (!this.bot) return;

    // 0. Text handler for interactive sessions (Admin broadcast, Channel config)
    this.bot.on('text', async (ctx, next) => {
      const telegramId = ctx.from.id.toString();
      const text = ctx.message.text.trim();

      if (text === '/cancel' || text === '❌ Bekor qilish') {
        if (this.adminSessions.has(telegramId)) {
          this.adminSessions.delete(telegramId);
          return ctx.reply('Jarayon bekor qilindi.', this.getMainKeyboard(true));
        }
      }

      // Check admin session
      if (this.adminSessions.has(telegramId)) {
        const session = this.adminSessions.get(telegramId);

        // 1. Broadcast Message
        if (session.step === 'awaiting_broadcast_message') {
          session.messageText = text;
          session.step = 'confirm_broadcast';
          return ctx.reply(
            `📢 <b>Xabar matni tayyor:</b>\n\n${text}\n\n` +
              `Ushbu xabarni barcha ro‘yxatdan o‘tgan Telegram foydalanuvchilariga yuborishni tasdiqlaysizmi?`,
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                [
                  Markup.button.callback('✅ Ha, barchaga yuborilsin', 'confirm_broadcast_yes'),
                  Markup.button.callback('❌ Bekor qilish', 'confirm_broadcast_no'),
                ],
              ]),
            }
          );
        }

        // 2. Set Mandatory Channel
        if (session.step === 'awaiting_channel_name') {
          this.adminSessions.delete(telegramId);
          let channel = text.trim();
          if (!channel.startsWith('@') && !channel.startsWith('-100')) {
            channel = '@' + channel;
          }

          let settings = await Settings.findOne();
          if (!settings) settings = new Settings();
          settings.mandatoryChannel = channel;
          settings.isMandatorySubEnabled = true;
          await settings.save();

          return ctx.reply(
            `✅ <b>Majburiy obuna kanali saqlandi va faollashtirildi!</b>\n\n` +
              `• Kanal: <b>${channel}</b>\n` +
              `• Holat: <b>🟢 Yoqilgan</b>\n\n` +
              `<i>Eslatma: Bot ushbu kanalda administrator bo‘lishi tavsiya etiladi.</i>`,
            {
              parse_mode: 'HTML',
              ...this.getMainKeyboard(true),
            }
          );
        }
      }

      // If user sends 6-digit code or link code directly in chat
      if (/^[a-zA-Z0-9_-]{6,32}$/.test(text)) {
        const matchingUser = await User.findOne({ telegramLinkToken: text });
        if (matchingUser) {
          matchingUser.telegramId = telegramId;
          matchingUser.telegramLinkToken = null;
          matchingUser.telegramLinkExpires = null;
          await matchingUser.save();

          socketService.emitTelegramLinked(matchingUser._id.toString(), {
            telegramId,
            username: ctx.from.username || null,
            firstName: ctx.from.first_name || matchingUser.name,
          });

          const isAdmin = await this.isUserAdmin(telegramId);
          return ctx.reply(
            `🎉 <b>Tabriklaymiz, ${matchingUser.name}!</b>\n\n` +
              `Sizning saytdagi profilingiz (<code>${matchingUser.email}</code>) Telegram boti bilan muvaffaqiyatli ulandi!\n\n` +
              `Endi barcha buyurtmalaringiz holati shu yerga keladi va siz Web App orqali tezda xarid qilishingiz mumkin.`,
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                [Markup.button.webApp('🛍️ Tort Buyurtma Qilish', this.getWebAppUrl())],
              ]),
              ...this.getMainKeyboard(isAdmin),
            }
          );
        }
      }

      return next();
    });

    // 1. /start command
    this.bot.start(async (ctx) => {
      try {
        const payload = (ctx.startPayload || '').trim();
        const telegramId = ctx.from.id.toString();
        const userName = ctx.from.first_name || 'Hurmatli mijoz';

        // Deep linking account connection (/start connect_<token> or /start <token>)
        if (payload) {
          const token = payload.replace(/^connect_/, '').trim();
          let user = await User.findOne({ telegramLinkToken: token });

          // Also allow if user is already linked with this telegramId
          if (!user) {
            const alreadyLinked = await User.findOne({ telegramId });
            if (alreadyLinked) {
              const isAdmin = await this.isUserAdmin(telegramId);
              return ctx.reply(
                `✅ <b>Assalomu alaykum, ${alreadyLinked.name}!</b>\n\n` +
                  `Sizning hisobingiz allaqachon botimizga ulangan. Web App orqali bemalol buyurtma berishingiz mumkin:`,
                {
                  parse_mode: 'HTML',
                  ...Markup.inlineKeyboard([
                    [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
                  ]),
                  ...this.getMainKeyboard(isAdmin),
                }
              );
            }
          }

          if (user) {
            user.telegramId = telegramId;
            user.telegramLinkToken = null;
            user.telegramLinkExpires = null;
            await user.save();

            socketService.emitTelegramLinked(user._id.toString(), {
              telegramId,
              username: ctx.from.username || null,
              firstName: ctx.from.first_name || '',
            });

            const isAdmin = await this.isUserAdmin(telegramId);
            return ctx.reply(
              `🎉 <b>Tabriklaymiz, ${user.name}!</b>\n\n` +
                `Sizning saytdagi profilingiz (<code>${user.email}</code>) ushbu botga muvaffaqiyatli bog‘landi!\n\n` +
                `🍰 <b>Imkoniyatlar:</b>\n` +
                `• Birgina tugma bilan Web App orqali xarid qilish;\n` +
                `• Buyurtma holatini jonli xabarlar orqali bilib turish;\n` +
                `• «Buyurtmalarim» menyusida istalgan vaqt kuzatish!`,
              {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                  [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
                ]),
                ...this.getMainKeyboard(isAdmin),
              }
            );
          }
        }

        // Check channel subscription
        const isSubscribed = await this.checkChannelSubscription(ctx, telegramId);
        if (!isSubscribed) return;

        const isAdmin = await this.isUserAdmin(telegramId);
        const linkedUser = await this.getLinkedUser(telegramId);

        return ctx.reply(
          `Assalomu alaykum, <b>${linkedUser ? linkedUser.name : userName}</b>! 🎂\n\n` +
            `<b>"Bol Tortlari"</b> rasmiy qandolat boti va xizmatiga xush kelibsiz!\n\n` +
            `Bu yerda siz mazali va bejirim tortlarni qulay Web App orqali xarid qilishingiz hamda buyurtmalaringiz holatini onlayn kuzatib borishingiz mumkin.`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
            ]),
            ...this.getMainKeyboard(isAdmin),
          }
        );
      } catch (err) {
        console.error('Bot /start error:', err);
        ctx.reply('Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
      }
    });

    // Check subscription callback button
    this.bot.action('check_subscription', async (ctx) => {
      try {
        const telegramId = ctx.from.id.toString();
        const settings = await Settings.findOne();
        const channel = settings?.mandatoryChannel || '';

        let isMember = false;
        try {
          const chatMember = await ctx.telegram.getChatMember(channel, Number(telegramId));
          isMember = ['creator', 'administrator', 'member', 'restricted'].includes(chatMember.status);
        } catch (e) {
          isMember = true;
        }

        if (isMember) {
          await ctx.answerCbQuery('✅ Rahmat, obuna tasdiqlandi!');
          try {
            await ctx.deleteMessage();
          } catch (e) {}

          const isAdmin = await this.isUserAdmin(telegramId);
          return ctx.reply(
            `🎉 <b>Obunangiz tasdiqlandi!</b>\n\nQuyidagi tugma orqali Web Appni ochib xarid qilishingiz mumkin:`,
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
              ]),
              ...this.getMainKeyboard(isAdmin),
            }
          );
        } else {
          return ctx.answerCbQuery('❌ Siz hali kanalga a’zo bo‘lmadingiz. Iltimos, avval obuna bo‘ling.', {
            show_alert: true,
          });
        }
      } catch (err) {
        console.error('Check sub error:', err);
      }
    });

    // 2. Buyurtmalarim (My Orders)
    this.bot.hears(['📦 Buyurtmalarim', '/orders'], async (ctx) => {
      return this.sendUserOrders(ctx);
    });

    // Refresh my orders action
    this.bot.action('refresh_my_orders', async (ctx) => {
      await ctx.answerCbQuery('Yangilanmoqda 🔄');
      try {
        await ctx.deleteMessage();
      } catch (e) {}
      return this.sendUserOrders(ctx);
    });

    // 3. Biz haqimizda & Aloqa
    this.bot.hears(['ℹ️ Biz haqimizda & Aloqa', '/help', '/contact'], async (ctx) => {
      const settings = (await Settings.findOne()) || {};
      const msg =
        `🎂 <b>"Bol Tortlari" Qandolatxonasi</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Har bir bayramingizga o‘zgacha shirinlik va mehr ulashamiz!\n\n` +
        `⏰ <b>Ish vaqti:</b> ${settings.workingHours || '09:00 - 21:00'}\n` +
        `📞 <b>Telefon:</b> ${settings.contactPhone || '+998 (90) 123-45-67'}\n` +
        `📍 <b>Manzil:</b> ${settings.contactAddress || 'Farg‘ona viloyati, Uchko‘prik tumani'}\n` +
        `🌐 <b>Rasmiy sayt:</b> ${this.clientUrl}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      return ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🛍️ Web App orqali buyurtma berish', this.getWebAppUrl())],
        ]),
      });
    });

    // 4. Admin Paneli command & hears
    this.bot.hears(['⚙️ Admin Paneli', '/admin'], async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) {
        return ctx.reply('⛔ Sizda admin huquqlari mavjud emas.');
      }
      return this.sendAdminMenu(ctx);
    });

    // Admin Menu Action
    this.bot.action('adm_menu', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');
      await ctx.answerCbQuery();
      return this.sendAdminMenu(ctx, true);
    });

    // Admin Stats Action & Command (/stats)
    this.bot.action('adm_stats', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');
      await ctx.answerCbQuery('Statistika yuklanmoqda...');
      return this.sendAdminStats(ctx, true);
    });
    this.bot.command('stats', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.reply('Ruxsat yo‘q.');
      return this.sendAdminStats(ctx, false);
    });

    // Admin Broadcast Action & Command (/broadcast)
    this.bot.action('adm_broadcast', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');
      await ctx.answerCbQuery();
      this.adminSessions.set(telegramId, { step: 'awaiting_broadcast_message' });
      return ctx.reply(
        `📢 <b>Barcha foydalanuvchilarga xabar yuborish (Broadcast)</b>\n\n` +
          `Barcha bot a’zolariga yuboriladigan xabar matnini kiriting.\n\n` +
          `❌ Bekor qilish uchun: /cancel`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['❌ Bekor qilish']]).resize(),
        }
      );
    });
    this.bot.command('broadcast', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.reply('Ruxsat yo‘q.');
      this.adminSessions.set(telegramId, { step: 'awaiting_broadcast_message' });
      return ctx.reply(
        `📢 <b>Barcha foydalanuvchilarga xabar yuborish (Broadcast)</b>\n\n` +
          `Barcha bot a’zolariga yuboriladigan xabar matnini kiriting.\n\n` +
          `❌ Bekor qilish uchun: /cancel`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['❌ Bekor qilish']]).resize(),
        }
      );
    });

    // Confirm Broadcast
    this.bot.action('confirm_broadcast_yes', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');

      const session = this.adminSessions.get(telegramId);
      if (!session || !session.messageText) {
        return ctx.answerCbQuery('Xabar matni topilmadi.');
      }

      const textToSend = session.messageText;
      this.adminSessions.delete(telegramId);

      await ctx.answerCbQuery('Xabarlar yuborilmoqda...');
      await ctx.reply('⏳ Xabar foydalanuvchilarga yuborilmoqda, kuting...');

      // Find all users with telegramId
      const users = await User.find({ telegramId: { $ne: null } });
      let sentCount = 0;
      let failCount = 0;

      for (const u of users) {
        if (!u.telegramId) continue;
        try {
          await this.bot.telegram.sendMessage(u.telegramId, textToSend, {
            parse_mode: 'HTML',
          });
          sentCount++;
        } catch (e) {
          failCount++;
        }
      }

      return ctx.reply(
        `✅ <b>Xabarnoma yakunlandi!</b>\n\n` +
          `• Muvaffaqiyatli yuborildi: <b>${sentCount} ta</b>\n` +
          `• Yetkazilmadi / Bloklangan: <b>${failCount} ta</b>`,
        {
          parse_mode: 'HTML',
          ...this.getMainKeyboard(true),
        }
      );
    });

    this.bot.action('confirm_broadcast_no', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      this.adminSessions.delete(telegramId);
      await ctx.answerCbQuery('Bekor qilindi.');
      try {
        await ctx.deleteMessage();
      } catch (e) {}
      return ctx.reply('Xabar yuborish bekor qilindi.', this.getMainKeyboard(true));
    });

    // Admin Mandatory Channel Subscription (/channel or adm_channel)
    this.bot.action('adm_channel', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');
      await ctx.answerCbQuery();
      return this.sendChannelConfig(ctx, true);
    });
    this.bot.command('channel', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.reply('Ruxsat yo‘q.');
      return this.sendChannelConfig(ctx, false);
    });

    // Toggle Channel Sub
    this.bot.action('adm_toggle_channel_sub', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      settings.isMandatorySubEnabled = !settings.isMandatorySubEnabled;
      await settings.save();

      await ctx.answerCbQuery(
        settings.isMandatorySubEnabled ? '🟢 Majburiy obuna yoqildi!' : '🔴 Majburiy obuna o‘chirildi!',
        { show_alert: true }
      );
      return this.sendChannelConfig(ctx, true);
    });

    // Change Channel Name
    this.bot.action('adm_change_channel_name', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');

      await ctx.answerCbQuery();
      this.adminSessions.set(telegramId, { step: 'awaiting_channel_name' });
      return ctx.reply(
        `✏️ <b>Kanal nomini kiriting</b> (masalan: <code>@boltortlar</code> yoki <code>@kanal_nomi</code>):\n\n` +
          `❌ Bekor qilish: /cancel`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['❌ Bekor qilish']]).resize(),
        }
      );
    });

    // Admin Active Orders
    this.bot.action('adm_active_orders', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const isAdmin = await this.isUserAdmin(telegramId);
      if (!isAdmin) return ctx.answerCbQuery('Ruxsat yo‘q.');
      await ctx.answerCbQuery();

      const activeOrders = await Order.find({
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'delivering', 'on_the_way'] },
      })
        .sort({ createdAt: -1 })
        .limit(5);

      if (!activeOrders || activeOrders.length === 0) {
        return ctx.reply('Hozirda yangi yoki faol buyurtmalar mavjud emas.', {
          ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Admin panel', 'adm_menu')]]),
        });
      }

      for (const ord of activeOrders) {
        const msg =
          `📦 <b>Buyurtma #${ord.orderId}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 Mijoz: <b>${ord.customer_name}</b> (<code>${ord.customer_phone}</code>)\n` +
          `📍 Manzil: ${ord.customer_address}\n` +
          `💰 Summa: <b>${(ord.total || 0).toLocaleString()} so‘m</b>\n` +
          `Holat: <b>${STATUS_LABELS[ord.status] || ord.status}</b>\n`;

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
    });

    // Admin Order Status Callback: ord_status:<orderId>:<status>
    this.bot.action(/^ord_status:(.+):(.+)$/, async (ctx) => {
      try {
        const orderId = ctx.match[1];
        const newStatus = ctx.match[2];
        const senderId = ctx.from.id.toString();

        const isAdmin = await this.isUserAdmin(senderId);
        if (!isAdmin) {
          return ctx.answerCbQuery('⛔ Sizda ruxsat yo‘q.', { show_alert: true });
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

        // Notify real-time Web App
        socketService.emitOrderStatus(order);

        // Notify customer directly in Telegram!
        await this.notifyCustomerOrderStatus(order);

        await ctx.answerCbQuery(`✅ Holat o‘zgartirildi: ${STATUS_LABELS[newStatus] || newStatus}`, {
          show_alert: true,
        });

        try {
          await ctx.editMessageText(
            ctx.callbackQuery.message.text + `\n\n✏️ <i>Holat yangilandi: ${STATUS_LABELS[newStatus] || newStatus}</i>`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {}
      } catch (err) {
        console.error('Order status callback error:', err);
        ctx.answerCbQuery('Xatolik.');
      }
    });

    // 9. Telegram Stars Payment (pre_checkout_query & successful_payment)
    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (err) {
        console.error('pre_checkout_query error:', err.message);
      }
    });

    this.bot.on('successful_payment', async (ctx) => {
      try {
        const payment = ctx.message.successful_payment;
        const orderId = payment.invoice_payload;
        console.log('⭐ Stars payment received for order:', orderId, payment.total_amount, 'XTR');
        if (orderId) {
          const order = await findOrderSafely(orderId);
          if (order) {
            order.payment_status = 'paid';
            order.status = 'confirmed';
            await order.save();
            await this.notifyAdminsNewOrder(order);
            await this.notifyCustomerOrderStatus(order);
          }
        }
        await ctx.reply(
          `🎉 <b>To‘lovingiz qabul qilindi! (${payment.total_amount} ⭐)</b>\n\n` +
            `Buyurtmangiz to‘landi va qabul qilindi. Tez orada yetkazib beramiz!`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.webApp('📦 Buyurtmani kuzatish', this.getWebAppUrl())],
            ]),
          }
        );
      } catch (err) {
        console.error('successful_payment error:', err.message);
      }
    });

    // 10. Telegram Business updates
    this.bot.on('business_connection', (ctx) => {
      console.log('💼 Telegram Business connection updated:', ctx.businessConnection?.id);
    });
    this.bot.on('business_message', async (ctx) => {
      try {
        const msg = ctx.businessMessage;
        if (msg?.text) {
          console.log('💼 Telegram Business message received:', msg.text);
        }
      } catch (e) {}
    });

    // 11. Mira AI Assistant Integration for freeform text questions
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return;
      if (['📦 Buyurtmalarim', 'ℹ️ Biz haqimizda & Aloqa', '⚙️ Admin Paneli'].includes(text)) return;

      try {
        await ctx.sendChatAction('typing');
        const aiResult = await aiService.processMessage(text, 'uz');
        let replyText = `🤖 <b>Mira AI:</b>\n\n${aiResult.answer}`;
        const buttons = [];
        if (aiResult.products && aiResult.products.length > 0) {
          replyText += `\n\n🍰 <b>Tavsiya etilgan tortlar:</b>\n`;
          for (const p of aiResult.products.slice(0, 3)) {
            replyText += `• <b>${p.name}</b> — ${(p.price || 0).toLocaleString()} so‘m\n`;
          }
          buttons.push([Markup.button.webApp('🛍️ Do‘konda buyurtma berish', this.getWebAppUrl())]);
        }
        await ctx.reply(replyText, {
          parse_mode: 'HTML',
          ...(buttons.length > 0 ? Markup.inlineKeyboard(buttons) : {}),
        });
      } catch (aiErr) {
        console.error('Telegram Mira AI fallback error:', aiErr.message);
      }
    });
  }

  // Display User Orders
  async sendUserOrders(ctx) {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await User.findOne({ telegramId });

      let filter = {};
      if (user) {
        filter = { $or: [{ customer: user._id }, { customer_phone: user.phone || 'unknown' }] };
      } else {
        // Not linked yet
        return ctx.reply(
          `📦 <b>Buyurtmalaringizni ko‘rish uchun hisobingizni ulang</b>\n\n` +
            `Sizning saytdagi profilingiz ushbu Telegram botga hali ulanmagan.\n` +
            `Saytda profilingizga kiring va «Telegram hisobini ulash» tugmasini bosing:`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
            ]),
          }
        );
      }

      const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(5);

      if (!orders || orders.length === 0) {
        return ctx.reply(
          `📦 <b>Sizda hozircha buyurtmalar mavjud emas.</b>\n\n` +
            `Mazali va sifatli tortlarimizni buyurtma qilish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.webApp('🛍️ Tort Buyurtma Qilish (Web App)', this.getWebAppUrl())],
            ]),
          }
        );
      }

      let text = `📦 <b>Sizning buyurtmalaringiz:</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      orders.forEach((ord, index) => {
        const statusText = STATUS_LABELS[ord.status] || ord.status;
        const itemsSummary = (ord.items || [])
          .map((it) => `• ${it.name} (${it.quantity || 1} dona)`)
          .join('\n');

        const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('uz-UZ') : '';

        text +=
          `<b>${index + 1}. Buyurtma #${ord.orderId}</b>\n` +
          `📊 Holat: <b>${statusText}</b>\n` +
          `💰 Summa: <b>${(ord.total || 0).toLocaleString()} so‘m</b>\n` +
          (dateStr ? `📅 Sana: ${dateStr}\n` : '') +
          (itemsSummary ? `${itemsSummary}\n` : '') +
          `━━━━━━━━━━━━━━━━━━━━\n\n`;
      });

      return ctx.reply(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Yangilash', 'refresh_my_orders')],
          [Markup.button.webApp('🛍️ Yangi buyurtma berish', this.getWebAppUrl())],
        ]),
      });
    } catch (err) {
      console.error('Send user orders error:', err);
      ctx.reply('Buyurtmalarni yuklashda xatolik yuz berdi.');
    }
  }

  // Display Admin Menu
  async sendAdminMenu(ctx, isEdit = false) {
    const text =
      `⚙️ <b>Qandolatxonasi Boshqaruv Paneli (Admin)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Kerakli bo‘limni tanlang:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📊 Statistika', 'adm_stats'),
        Markup.button.callback('📢 Xabar yuborish', 'adm_broadcast'),
      ],
      [
        Markup.button.callback('📢 Majburiy obuna', 'adm_channel'),
        Markup.button.callback('📦 Faol buyurtmalar', 'adm_active_orders'),
      ],
      [Markup.button.url('🌐 Sayt Admin Paneli', `${this.clientUrl}/admin`)],
    ]);

    if (isEdit && ctx.callbackQuery) {
      try {
        return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
      } catch (e) {}
    }
    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Display Admin Stats
  async sendAdminStats(ctx, isEdit = false) {
    try {
      const totalUsers = await User.countDocuments();
      const telegramUsers = await User.countDocuments({ telegramId: { $ne: null } });
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({
        status: { $in: ['pending', 'confirmed', 'preparing', 'delivering', 'on_the_way'] },
      });

      // Today's stats
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayOrders = await Order.find({ createdAt: { $gte: startOfDay } });
      const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // All revenue
      const deliveredOrders = await Order.find({ status: 'delivered' });
      const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const text =
        `📊 <b>Qandolatxonasi Statistikasi:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👥 <b>Foydalanuvchilar:</b>\n` +
        `• Jami foydalanuvchilar: <b>${totalUsers} ta</b>\n` +
        `• Telegramga ulanganlar: <b>${telegramUsers} ta</b>\n\n` +
        `📦 <b>Buyurtmalar:</b>\n` +
        `• Jami buyurtmalar: <b>${totalOrders} ta</b>\n` +
        `• Kutilayotgan / Faol: <b>${pendingOrders} ta</b>\n` +
        `• Bugungi yangi buyurtmalar: <b>${todayOrders.length} ta</b>\n\n` +
        `💰 <b>Moliyaviy ko‘rsatkichlar:</b>\n` +
        `• Bugungi tushum: <b>${todayTotal.toLocaleString()} so‘m</b>\n` +
        `• Jami yetkazilgan tushum: <b>${totalDeliveredRevenue.toLocaleString()} so‘m</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Yangilash', 'adm_stats')],
        [Markup.button.callback('🔙 Admin panel', 'adm_menu')],
      ]);

      if (isEdit && ctx.callbackQuery) {
        try {
          return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
        } catch (e) {}
      }
      return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
    } catch (err) {
      console.error('Send admin stats error:', err);
      ctx.reply('Statistikani yuklashda xatolik yuz berdi.');
    }
  }

  // Display Channel Config
  async sendChannelConfig(ctx, isEdit = false) {
    try {
      const settings = (await Settings.findOne()) || {};
      const isEnabled = Boolean(settings.isMandatorySubEnabled);
      const channel = settings.mandatoryChannel || 'Belgilanmagan';

      const text =
        `📢 <b>Majburiy Obuna Sozlamalari:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• Holat: <b>${isEnabled ? '🟢 Yoqilgan' : '🔴 O‘chirilgan'}</b>\n` +
        `• Kanal: <b>${channel}</b>\n\n` +
        `<i>Agar yoqilsa, bot foydalanuvchilari ushbu kanalga obuna bo‘lmaguncha botdan foydalana olmaydilar.</i>`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            isEnabled ? '🔴 Obunani o‘chirish' : '🟢 Obunani yoqish',
            'adm_toggle_channel_sub'
          ),
        ],
        [Markup.button.callback('✏️ Kanalni o‘zgartirish', 'adm_change_channel_name')],
        [Markup.button.callback('🔙 Admin panel', 'adm_menu')],
      ]);

      if (isEdit && ctx.callbackQuery) {
        try {
          return await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
        } catch (e) {}
      }
      return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
    } catch (err) {
      console.error('Channel config error:', err);
    }
  }

  /**
   * Notify Admin when a new order arrives
   */
  async notifyNewOrder(order) {
    if (!this.bot || !order) return;
    try {
      const itemsList = (order.items || [])
        .map((it, idx) => `${idx + 1}. <b>${it.name}</b> (${it.quantity} x ${(it.price || 0).toLocaleString()} so‘m)`)
        .join('\n');

      const message =
        `🎂 <b>YANGI BUYURTMA #${order.orderId}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Mijoz:</b> ${order.customer_name}\n` +
        `📞 <b>Telefon:</b> <code>${order.customer_phone}</code>\n` +
        `📍 <b>Manzil:</b> ${order.customer_address}\n` +
        `💰 <b>Jami summa:</b> <b>${(order.total || 0).toLocaleString()} so‘m</b>\n` +
        (order.notes ? `📝 <b>Izoh:</b> <i>${order.notes}</i>\n` : '') +
        `\n🧁 <b>Mahsulotlar:</b>\n${itemsList || 'Standart mahsulot'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Holatni o‘zgartirish uchun tugmalardan foydalaning:`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Qabul qilish', `ord_status:${order.orderId}:confirmed`),
          Markup.button.callback('👨‍🍳 Oshxona', `ord_status:${order.orderId}:preparing`),
        ],
        [
          Markup.button.callback('🛵 Kuryerda', `ord_status:${order.orderId}:on_the_way`),
          Markup.button.callback('🎉 Yetkazildi', `ord_status:${order.orderId}:delivered`),
        ],
        [Markup.button.callback('❌ Bekor qilish', `ord_status:${order.orderId}:cancelled`)],
      ]);

      await this.bot.telegram.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML',
        ...keyboard,
      });
    } catch (err) {
      console.error('Telegram admin bildirishnomasini yuborishda xatolik:', err.message);
    }
  }

  /**
   * Notify customer when their order is first received
   */
  async notifyCustomerNewOrder(order) {
    if (!this.bot || !order) return;
    try {
      let customer = null;
      if (order.customer) {
        customer = await User.findById(order.customer);
      }
      if (!customer && order.customer_phone) {
        customer = await User.findOne({ phone: order.customer_phone });
      }

      const telegramId = customer?.telegramId;
      if (!telegramId) return;

      const text =
        `🎉 <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
        `Hurmatli <b>${order.customer_name}</b>, sizning buyurtmangiz muvaffaqiyatli ro‘yxatga olindi.\n\n` +
        `• Buyurtma raqami: <b>#${order.orderId}</b>\n` +
        `• Jami summa: <b>${(order.total || 0).toLocaleString()} so‘m</b>\n` +
        `• Holati: <b>🟡 Kutilmoqda</b>\n\n` +
        `Tez orada ma’muriyatimiz buyurtmangizni tasdiqlaydi va tayyorlashni boshlaydi!`;

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🌐 Buyurtmalarimni ko‘rish', this.getWebAppUrl())],
        ]),
      });
    } catch (err) {
      console.error('Notify customer new order error:', err.message);
    }
  }

  /**
   * Customer Notification: Notify customer when order status changes (confirmed, preparing, etc.)
   */
  async notifyCustomerOrderStatus(order) {
    if (!this.bot || !order) return;
    try {
      let customer = null;
      if (order.customer) {
        customer = await User.findById(order.customer);
      }
      if (!customer && order.customer_phone) {
        customer = await User.findOne({ phone: order.customer_phone });
      }

      const telegramId = customer?.telegramId;
      if (!telegramId) return;

      const statusMessages = {
        confirmed: '🟢 <b>Buyurtmangiz tasdiqlandi va qabul qilindi!</b>\nQandolatchilarimiz tez orada tayyorlashga kirishadilar.',
        preparing: '👨‍🍳 <b>Buyurtmangiz tayyorlanmoqda!</b>\nSiz uchun eng toza va sifatli masalliqlardan shirinlik tayyorlanmoqda.',
        ready: '🧁 <b>Buyurtmangiz tayyor bo‘ldi!</b>\nQadoqlanib, yetkazib berish bo‘limiga yo‘naltirildi.',
        delivering: '🛵 <b>Buyurtmangiz kuryerda va yo‘lga chiqdi!</b>\nTez orada kuryerimiz ko‘rsatilgan manzilga yetib boradi.',
        on_the_way: '🛵 <b>Buyurtmangiz kuryerda va yo‘lga chiqdi!</b>\nTez orada kuryerimiz ko‘rsatilgan manzilga yetib boradi.',
        delivered: '🎉 <b>Buyurtmangiz yetkazib berildi!</b>\nYoqimli ishtaha! Bayramingiz shirin va unutilmas o‘tsin.',
        cancelled: '❌ <b>Buyurtmangiz bekor qilindi.</b>\nSavollaringiz bo‘lsa, biz bilan bog‘laning.',
      };

      const customMsg = statusMessages[order.status] || `Holat: ${STATUS_LABELS[order.status] || order.status}`;

      const text =
        `📦 <b>Buyurtmangiz holati yangilandi!</b>\n\n` +
        `• Buyurtma raqami: <b>#${order.orderId}</b>\n` +
        `• Holat: <b>${STATUS_LABELS[order.status] || order.status}</b>\n\n` +
        `${customMsg}\n\n` +
        `💰 Jami: <b>${(order.total || 0).toLocaleString()} so‘m</b>\n` +
        `📍 Manzil: ${order.customer_address}`;

      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🌐 Web Appda ko‘rish', this.getWebAppUrl())],
        ]),
      });
    } catch (err) {
      console.error('Xaridorga Telegram xabari yuborishda xatolik:', err.message);
    }
  }

  /**
   * Telegram Stars: Create invoice link for Stars payment
   */
  async createStarsInvoiceLink({ title, description, payload, starsAmount }) {
    if (!this.bot) throw new Error('Telegram bot faol emas');
    const amount = Math.max(1, Math.round(Number(starsAmount) || 1));
    const invoiceLink = await this.bot.telegram.createInvoiceLink({
      title: title || 'Bol Tortlari Buyurtmasi',
      description: description || 'Premium tort xaridi uchun Telegram Stars to‘lovi',
      payload: String(payload || 'order_stars'),
      currency: 'XTR',
      prices: [{ label: title || 'Bol Tortlari', amount }],
      provider_token: '', // Required empty string for Telegram Stars
    });
    return invoiceLink;
  }
}

export const telegramBotService = new TelegramBotService();
