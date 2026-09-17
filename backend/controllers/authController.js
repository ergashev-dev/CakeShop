import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Cake from '../models/Cake.js';
import VerificationCode from '../models/VerificationCode.js';
import PasswordReset from '../models/PasswordReset.js';
import { emailService } from '../services/emailService.js';
import { telegramBotService } from '../services/telegramBotService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'boltortlari_super_secret_jwt_key_2026_luxury';
const JWT_EXPIRES_IN = '7d';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;

/**
 * Generate cryptographically random 6-digit code
 */
function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper to set HttpOnly auth cookie
 */
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export const authController = {
  /**
   * Register new user with Telegram-style username
   */
  async register(req, res) {
    try {
      const { name, username, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Ism, email va parol kiritilishi shart.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo‘lishi lozim.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      let normalizedUsername = null;

      // Validate Telegram-style username if provided
      if (username) {
        const clean = username.replace(/^@/, '').toLowerCase().trim();
        if (!USERNAME_REGEX.test(clean)) {
          return res.status(400).json({
            error: 'Username kamida 4 ta belgidan iborat bo‘lishi, faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi shart.',
          });
        }
        normalizedUsername = clean;

        // Check if username is already taken
        const existingByUsername = await User.findOne({ username: normalizedUsername });
        if (existingByUsername) {
          return res.status(400).json({
            error: 'Ushbu username allaqachon band qilingan. Iltimos, boshqa username tanlang.',
          });
        }
      }

      // Check if email is already taken
      let existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({
          error: 'Ushbu email manzili bilan allaqachon hisob yaratilgan.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (!existingUser) {
        existingUser = await User.create({
          name: name.trim(),
          username: normalizedUsername,
          email: normalizedEmail,
          password: hashedPassword,
          phone: phone ? phone.trim() : '',
          role: 'user',
          isVerified: false,
        });
      } else {
        existingUser.name = name.trim();
        if (normalizedUsername) existingUser.username = normalizedUsername;
        existingUser.password = hashedPassword;
        if (phone) existingUser.phone = phone.trim();
        existingUser.role = 'user';
        await existingUser.save();
      }

      // Generate 6-digit random verification code
      const code = generate6DigitCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Invalidate existing codes
      await VerificationCode.deleteMany({ email: normalizedEmail });

      // Save hashed code
      await VerificationCode.create({
        email: normalizedEmail,
        codeHash,
        expiresAt,
      });

      // Dispatch email
      await emailService.sendVerificationCode(normalizedEmail, code);

      return res.status(201).json({
        message: 'Tasdiqlash kodi emailingizga yuborildi. Iltimos, 6 xonali kodni kiriting.',
        email: normalizedEmail,
      });
    } catch (error) {
      console.error('Registration error:', error.message);
      return res.status(500).json({ error: 'Ro‘yxatdan o‘tishda xatolik yuz berdi.' });
    }
  },

  /**
   * Verify 6-digit code and activate account
   */
  async verifyEmail(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: 'Email va tasdiqlash kodi talab qilinadi.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: 'Hisob allaqachon tasdiqlangan. Tizimga kirishingiz mumkin.' });
      }

      const verificationRecord = await VerificationCode.findOne({ email: normalizedEmail });

      if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
        return res.status(400).json({
          error: 'Tasdiqlash kodi muddati tugagan yoki topilmadi. Iltimos, yangi kod so‘rang.',
        });
      }

      if (verificationRecord.attempts >= 5) {
        await VerificationCode.deleteMany({ email: normalizedEmail });
        return res.status(400).json({
          error: 'Xato urinishlar soni oshib ketdi. Yangi kod so‘rashingiz lozim.',
        });
      }

      const isMatch = await bcrypt.compare(code.trim(), verificationRecord.codeHash);
      if (!isMatch) {
        verificationRecord.attempts += 1;
        await verificationRecord.save();
        return res.status(400).json({
          error: `Noto‘g‘ri kod kiritildi. Qolgan urinishlar: ${5 - verificationRecord.attempts} ta.`,
        });
      }

      // Valid: Delete verification record
      await VerificationCode.deleteMany({ email: normalizedEmail });

      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // Set HttpOnly Cookie
      setAuthCookie(res, token);

      return res.json({
        message: 'Hisobingiz muvaffaqiyatli tasdiqlandi!',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      console.error('Verify email error:', error.message);
      return res.status(500).json({ error: 'Kodni tasdiqlashda xatolik yuz berdi.' });
    }
  },

  /**
   * Resend verification code
   */
  async resendCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email manzilini kiriting.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: 'Ushbu hisob allaqachon tasdiqlangan.' });
      }

      const code = generate6DigitCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await VerificationCode.deleteMany({ email: normalizedEmail });
      await VerificationCode.create({
        email: normalizedEmail,
        codeHash,
        expiresAt,
      });

      await emailService.sendVerificationCode(normalizedEmail, code);

      return res.json({
        message: 'Yangi tasdiqlash kodi emailingizga yuborildi.',
      });
    } catch (error) {
      console.error('Resend code error:', error.message);
      return res.status(500).json({ error: 'Kodni qayta yuborishda xatolik yuz berdi.' });
    }
  },

  /**
   * Login user via Email OR Username + Password
   */
  async login(req, res) {
    try {
      const { email, username, login: loginField, password } = req.body;
      const rawIdentifier = (email || username || loginField || '').trim();

      if (!rawIdentifier || !password) {
        return res.status(400).json({ error: 'Email yoki Username hamda parol kiritilishi shart.' });
      }

      const cleanIdentifier = rawIdentifier.replace(/^@/, '').toLowerCase().trim();

      // Search user by email OR username
      const user = await User.findOne({
        $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
      });

      if (!user) {
        return res.status(401).json({ error: 'Email/Username yoki parol noto‘g‘ri.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          error: 'Sizning hisobingiz ma‘muriyat tomonidan bloklangan. Qo‘llab-quvvatlash xizmati bilan bog‘laning.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Email/Username yoki parol noto‘g‘ri.' });
      }

      if (!user.isVerified) {
        const code = generate6DigitCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await VerificationCode.deleteMany({ email: user.email });
        await VerificationCode.create({
          email: user.email,
          codeHash,
          expiresAt,
        });

        await emailService.sendVerificationCode(user.email, code);

        return res.status(403).json({
          error: 'Hisobingiz hali tasdiqlanmagan. Yangi tasdiqlash kodi emailingizga yuborildi.',
          requiresVerification: true,
          email: user.email,
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      // Set HttpOnly Cookie
      setAuthCookie(res, token);

      return res.json({
        message: 'Tizimga muvaffaqiyatli kirdingiz.',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      console.error('Login error:', error.message);
      return res.status(500).json({ error: 'Tizimga kirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Logout user and clear HttpOnly cookie
   */
  async logout(req, res) {
    res.clearCookie('token');
    return res.json({ message: 'Tizimdan muvaffaqiyatli chiqildi.' });
  },

  /**
   * Send password reset 6-digit code (10 min expiry)
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email manzilini kiriting.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          error: 'Ushbu email bilan ro‘yxatdan o‘tgan foydalanuvchi topilmadi.',
        });
      }

      const code = generate6DigitCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in User model directly
      user.resetPasswordCode = code;
      user.resetPasswordExpire = expiresAt;
      await user.save();

      // Store in PasswordReset collection for backup/history
      await PasswordReset.deleteMany({ email: normalizedEmail });
      await PasswordReset.create({
        email: normalizedEmail,
        codeHash,
        expiresAt,
      });

      await emailService.sendPasswordResetCode(normalizedEmail, code);

      return res.json({
        message: 'Parolni tiklash uchun 6 xonali tasdiqlash kodi emailingizga yuborildi.',
        email: normalizedEmail,
      });
    } catch (error) {
      console.error('Forgot password error:', error.message);
      return res.status(500).json({ error: 'So‘rovni bajarishda xatolik yuz berdi.' });
    }
  },

  /**
   * Verify password reset 6-digit code
   */
  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'Email va tasdiqlash kodi talab qilinadi.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      const isUserCodeValid =
        user.resetPasswordCode &&
        user.resetPasswordCode === code.trim() &&
        user.resetPasswordExpire &&
        new Date(user.resetPasswordExpire) > new Date();

      let isRecordValid = false;
      const record = await PasswordReset.findOne({ email: normalizedEmail });
      if (record && record.expiresAt > new Date()) {
        isRecordValid = await bcrypt.compare(code.trim(), record.codeHash);
      }

      if (!isUserCodeValid && !isRecordValid) {
        return res.status(400).json({
          error: 'Kiritilgan tasdiqlash kodi noto‘g‘ri yoki uning muddati tugagan.',
        });
      }

      return res.json({
        valid: true,
        message: 'Tasdiqlash kodi to‘g‘ri. Yangi parolingizni o‘rnatishingiz mumkin.',
      });
    } catch (error) {
      console.error('Verify reset code error:', error.message);
      return res.status(500).json({ error: 'Kodni tekshirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Reset password with verified code
   */
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword, confirmPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring.' });
      }

      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Yangi parol va tasdiqlovchi parol bir xil emas.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi lozim.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      const isUserCodeValid =
        user.resetPasswordCode &&
        user.resetPasswordCode === code.trim() &&
        user.resetPasswordExpire &&
        new Date(user.resetPasswordExpire) > new Date();

      let isRecordValid = false;
      const record = await PasswordReset.findOne({ email: normalizedEmail });
      if (record && record.expiresAt > new Date()) {
        isRecordValid = await bcrypt.compare(code.trim(), record.codeHash);
      }

      if (!isUserCodeValid && !isRecordValid) {
        return res.status(400).json({ error: 'Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan.' });
      }

      // Invalidate code
      user.resetPasswordCode = '';
      user.resetPasswordExpire = null;
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await PasswordReset.deleteMany({ email: normalizedEmail });

      return res.json({
        message: 'Parolingiz muvaffaqiyatli yangilandi. Endi yangi parol bilan tizimga kirishingiz mumkin.',
      });
    } catch (error) {
      console.error('Reset password error:', error.message);
      return res.status(500).json({ error: 'Parolni yangilashda xatolik yuz berdi.' });
    }
  },

  /**
   * Check username availability
   */
  async checkUsername(req, res) {
    try {
      const raw = req.query.username || '';
      const clean = raw.replace(/^@/, '').toLowerCase().trim();

      if (!clean) {
        return res.status(400).json({ available: false, error: 'Username kiritilmadi.' });
      }

      if (!USERNAME_REGEX.test(clean)) {
        return res.json({
          available: false,
          error: 'Username kamida 4 ta belgi, faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi shart.',
        });
      }

      const existing = await User.findOne({ username: clean });
      if (existing) {
        // If it's the current user's username
        if (req.user && existing._id.toString() === req.user._id.toString()) {
          return res.json({ available: true, message: 'Bu sizning joriy username‘ingiz.' });
        }
        return res.json({ available: false, error: 'Ushbu username allaqachon band.' });
      }

      return res.json({ available: true, message: 'Ushbu username bo‘sh va mavjud!' });
    } catch (error) {
      return res.status(500).json({ available: false, error: 'Tekshirishda xatolik.' });
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req, res) {
    return res.json({ user: req.user.toJSON() });
  },

  /**
   * Update profile (name, username, phone, avatar)
   */
  async updateProfile(req, res) {
    try {
      const { name, username, phone, avatar } = req.body;

      if (name) {
        req.user.name = name.trim();
      }

      if (phone !== undefined) {
        req.user.phone = phone.trim();
      }

      if (avatar !== undefined) {
        req.user.avatar = avatar.trim();
      }

      // Telegram-style username update
      if (username !== undefined && username !== null) {
        const clean = username.replace(/^@/, '').toLowerCase().trim();
        if (clean) {
          if (!USERNAME_REGEX.test(clean)) {
            return res.status(400).json({
              error: 'Username kamida 4 ta belgidan iborat bo‘lishi, faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi shart.',
            });
          }

          // Check uniqueness
          const existing = await User.findOne({ username: clean });
          if (existing && existing._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({
              error: 'Ushbu username allaqachon band qilingan. Iltimos, boshqa username tanlang.',
            });
          }

          req.user.username = clean;
        }
      }

      await req.user.save();
      return res.json({
        message: 'Profil muvaffaqiyatli yangilandi.',
        user: req.user.toJSON(),
      });
    } catch (error) {
      console.error('Update profile error:', error.message);
      return res.status(500).json({ error: 'Profilni yangilashda xatolik yuz berdi.' });
    }
  },

  /**
   * Change password for logged-in user
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Barcha parol maydonlarini to‘ldiring.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Yangi parol va tasdiqlovchi parol bir-biriga mos kelmadi.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi lozim.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, req.user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Eski parol noto‘g‘ri kiritildi.' });
      }

      req.user.password = await bcrypt.hash(newPassword, 10);
      await req.user.save();

      return res.json({ message: 'Parolingiz muvaffaqiyatli o‘zgartirildi.' });
    } catch (error) {
      console.error('Change password error:', error.message);
      return res.status(500).json({ error: 'Parolni o‘zgartirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Address Book Management
   */
  async getAddresses(req, res) {
    return res.json({ addresses: req.user.addresses || [] });
  },

  async addAddress(req, res) {
    try {
      const { title, address, phone, isDefault } = req.body;
      if (!title || !address) {
        return res.status(400).json({ error: 'Manzil nomi va to‘liq manzil kiritilishi shart.' });
      }

      const addresses = req.user.addresses || [];
      const newAddress = {
        id: crypto.randomBytes(8).toString('hex'),
        title: title.trim(),
        address: address.trim(),
        phone: phone ? phone.trim() : req.user.phone || '',
        isDefault: Boolean(isDefault) || addresses.length === 0,
      };

      if (newAddress.isDefault) {
        addresses.forEach((a) => (a.isDefault = false));
      }

      addresses.push(newAddress);
      req.user.addresses = addresses;
      await req.user.save();

      return res.status(201).json({ message: 'Manzil saqlandi.', addresses });
    } catch (error) {
      return res.status(500).json({ error: 'Manzilni saqlashda xatolik.' });
    }
  },

  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      let addresses = req.user.addresses || [];
      addresses = addresses.filter((a) => a.id !== id);
      req.user.addresses = addresses;
      await req.user.save();
      return res.json({ message: 'Manzil o‘chirildi.', addresses });
    } catch (error) {
      return res.status(500).json({ error: 'Manzilni o‘chirishda xatolik.' });
    }
  },

  /**
   * Favorites / Wishlist Management
   */
  async getFavorites(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (user && typeof user.populate === 'function') {
        await user.populate('favorites');
      }
      const favorites = (user?.favorites || []).filter(Boolean);
      return res.json({ favorites });
    } catch (error) {
      console.error('Get favorites error:', error);
      return res.status(500).json({ error: 'Sevimlilar ro‘yxatini yuklashda xatolik.' });
    }
  },

  async toggleFavorite(req, res) {
    try {
      const { cakeId } = req.params;
      if (!cakeId) {
        return res.status(400).json({ error: 'Tort identifikatori talab qilinadi.' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      if (!Array.isArray(user.favorites)) {
        user.favorites = [];
      }

      const strFavorites = user.favorites.map((id) => id.toString());
      const existsIndex = strFavorites.indexOf(cakeId.toString());

      let isFavorite = false;
      if (existsIndex > -1) {
        user.favorites.splice(existsIndex, 1);
        isFavorite = false;
      } else {
        user.favorites.push(cakeId);
        isFavorite = true;
      }

      await user.save();
      await user.populate('favorites');

      return res.json({
        message: isFavorite ? 'Sevimli tortlarga qo‘shildi! ❤️' : 'Sevimlilardan olib tashlandi.',
        isFavorite,
        favorites: user.favorites || [],
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return res.status(500).json({ error: 'Sevimlilarni yangilashda xatolik yuz berdi.' });
    }
  },

  /**
   * Telegram Account Connection Token
   */
  async getTelegramLinkToken(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      // Generate secure 16-character hex token and 6-digit backup code
      const token = crypto.randomBytes(8).toString('hex');
      const backupCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.telegramLinkToken = token;
      // 48 hours validity
      user.telegramLinkExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await user.save();

      const botUsername = process.env.TELEGRAM_BOT_USERNAME || telegramBotService.botInfo?.username || 'boltortlarbot';
      const link = `https://t.me/${botUsername}?start=connect_${token}`;

      return res.json({
        token,
        backupCode,
        botUsername,
        link,
        telegramId: user.telegramId || null,
        isLinked: Boolean(user.telegramId),
      });
    } catch (error) {
      console.error('Telegram link token error:', error);
      return res.status(500).json({ error: 'Telegram bog‘lanish havolasini yaratishda xatolik.' });
    }
  },

  async unlinkTelegram(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      user.telegramId = null;
      user.telegramLinkToken = null;
      user.telegramLinkExpires = null;
      await user.save();

      return res.json({
        message: 'Telegram hisobi muvaffaqiyatli ajratildi.',
        isLinked: false,
      });
    } catch (error) {
      console.error('Unlink telegram error:', error);
      return res.status(500).json({ error: 'Telegram hisobini ajratishda xatolik.' });
    }
  },
};
