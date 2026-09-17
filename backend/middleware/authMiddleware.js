import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o‘tilmagan. Iltimos, tizimga kiring.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'boltortlari_super_secret_jwt_key_2026_luxury');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Sizning hisobingiz ma‘muriyat tomonidan bloklangan.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessiya muddati tugagan yoki token yaroqsiz.' });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'boltortlari_super_secret_jwt_key_2026_luxury');
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore optional auth error
  }
  next();
};
