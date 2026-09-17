import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { loginLimiter, resendCodeLimiter, authActionLimiter } from '../middleware/rateLimiter.js';
import passport from 'passport';

const router = Router();

// Authentication
router.post('/register', authActionLimiter, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', resendCodeLimiter, authController.resendCode);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Google OAuth Authentication
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'dummy_client_id') {
    const clientUrl = process.env.CLIENT_URL || 'https://boltortlar.uz';
    return res.redirect(`${clientUrl}/?auth_error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback', authController.googleCallback);
router.post('/google/token', authController.googleTokenLogin);

// Password recovery
router.post('/forgot-password', authActionLimiter, authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Username availability check
router.get('/check-username', authController.checkUsername);

// Profile and Settings (Protected)
router.get('/me', authMiddleware, authController.getMe);
router.get('/profile', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

// Address Book
router.get('/addresses', authMiddleware, authController.getAddresses);
router.post('/addresses', authMiddleware, authController.addAddress);
router.delete('/addresses/:id', authMiddleware, authController.deleteAddress);

// Favorites / Wishlist
router.get('/favorites', authMiddleware, authController.getFavorites);
router.post('/favorites/:cakeId', authMiddleware, authController.toggleFavorite);

// Telegram Account Linking
router.get('/telegram-link-token', authMiddleware, authController.getTelegramLinkToken);
router.post('/telegram-link-token', authMiddleware, authController.getTelegramLinkToken);
router.post('/telegram-unlink', authMiddleware, authController.unlinkTelegram);

export default router;
