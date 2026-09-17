import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { loginLimiter, resendCodeLimiter, authActionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Authentication
router.post('/register', authActionLimiter, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', resendCodeLimiter, authController.resendCode);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

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
