import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Get payment config (available methods, merchants, test mode)
router.get('/config', paymentController.getConfig);

// Generate Payme or Click checkout redirect URL
router.post('/checkout-url', paymentLimiter, optionalAuthMiddleware, paymentController.createPaymentUrl);

// Process Direct Card payment (Uzcard, Humo, Visa, Mastercard)
router.post('/card', paymentLimiter, optionalAuthMiddleware, paymentController.processCardPayment);

// Webhook endpoints for Payme & Click merchant callbacks
router.post('/payme', paymentController.handlePaymeWebhook);
router.post('/click', paymentController.handleClickWebhook);

export default router;
