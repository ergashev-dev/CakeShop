import express from 'express';
import rateLimit from 'express-rate-limit';
import { aiController } from '../controllers/aiController.js';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Rate limiter: 60 AI requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    error: 'So‘rovlar soni juda ko‘p. Iltimos, bir daqiqadan so‘ng qayta urinib ko‘ring.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat endpoint with optional authentication
router.post('/chat', aiLimiter, optionalAuthMiddleware, aiController.chat);

// Public AI settings
router.get('/settings', aiController.getSettings);

// Public structured site knowledge
router.get('/site-info', aiController.getSiteInfo);

// Admin-only AI stats & memory management
router.get('/stats', authMiddleware, adminMiddleware, aiController.getStats);
router.get('/memories', authMiddleware, adminMiddleware, aiController.getMemories);
router.post('/memories', authMiddleware, adminMiddleware, aiController.addMemory);
router.delete('/memories/:id', authMiddleware, adminMiddleware, aiController.deleteMemory);
router.post('/admin-chat', authMiddleware, adminMiddleware, aiController.adminChat);

export default router;
