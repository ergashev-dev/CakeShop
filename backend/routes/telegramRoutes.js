import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { telegramBotService } from '../services/telegramBotService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bol-tortlari-secret-key-2024';

/**
 * Validate Telegram WebApp initData HMAC-SHA256 signature
 */
function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    const params = Array.from(urlParams.entries());
    params.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = params.map(([k, v]) => `${k}=${v}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    const userJson = urlParams.get('user');
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch (err) {
    console.error('Validate initData error:', err.message);
    return null;
  }
}

/**
 * POST /api/telegram/webapp-auth
 * 1-second auto-login inside Telegram Mini App
 */
router.post('/webapp-auth', async (req, res) => {
  try {
    const { initData } = req.body;
    const botToken = telegramBotService.token;

    const tgUser = validateTelegramInitData(initData, botToken);
    if (!tgUser || !tgUser.id) {
      return res.status(401).json({ error: 'Telegram autentifikatsiyasi yaroqsiz.' });
    }

    const telegramId = tgUser.id.toString();
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Create user from Telegram data
      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || `TG User ${telegramId}`;
      const email = `tg_${telegramId}@boltortlar.uz`;
      const randomPass = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        name,
        email,
        password: randomPass,
        telegramId,
        username: tgUser.username || null,
        role: 'user',
        authProvider: 'telegram',
      });
    } else {
      // Update username / name if changed
      if (tgUser.username && user.username !== tgUser.username) {
        user.username = tgUser.username;
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      ok: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        telegramId: user.telegramId,
        is_premium: Boolean(tgUser.is_premium),
      },
    });
  } catch (error) {
    console.error('TMA webapp-auth error:', error);
    return res.status(500).json({ error: 'Telegram autentifikatsiyasida xatolik.' });
  }
});

/**
 * POST /api/telegram/create-invoice
 * Generate Telegram Stars invoice link
 */
router.post('/create-invoice', async (req, res) => {
  try {
    const { orderId, amountStars, title, description } = req.body;
    if (!orderId || !amountStars) {
      return res.status(400).json({ error: 'Buyurtma ID va Stars miqdori talab qilinadi.' });
    }

    const invoiceLink = await telegramBotService.createStarsInvoiceLink({
      title: title || `Buyurtma #${orderId}`,
      description: description || `Bol Tortlari xaridi uchun to‘lov`,
      payload: String(orderId),
      starsAmount: Number(amountStars),
    });

    return res.json({ ok: true, invoiceLink });
  } catch (error) {
    console.error('create-invoice error:', error);
    return res.status(500).json({ error: error.message || 'Invoice havolasini yaratishda xatolik.' });
  }
});

export default router;
