import rateLimit from 'express-rate-limit';

// Login brute force protection: 10 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Juda ko‘p urinishlar qilindi. Xavfsizlik yuzasidan 15 daqiqadan so‘ng qayta urinib ko‘ring.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Resend verification email protection: 1 per 60 seconds
export const resendCodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: {
    error: 'Tasdiqlash kodini 60 soniyada 1 martadan ortiq so‘rash mumkin emas. Iltimos, biroz kuting.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General auth endpoints limiter
export const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'So‘rovlar soni oshib ketdi. Iltimos, 15 daqiqadan so‘ng urinib ko‘ring.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment & Checkout limiter: 20 per 10 minutes
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: 'To‘lov yoki buyurtma so‘rovlari soni oshib ketdi. Iltimos, bir oz kuting.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
