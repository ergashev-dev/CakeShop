import express from 'express';
import { promoController } from '../controllers/promoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/validate', promoController.validatePromoCode);
router.get('/', authMiddleware, adminMiddleware, promoController.getPromoCodes);
router.post('/', authMiddleware, adminMiddleware, promoController.createPromoCode);
router.delete('/:id', authMiddleware, adminMiddleware, promoController.deletePromoCode);

export default router;
