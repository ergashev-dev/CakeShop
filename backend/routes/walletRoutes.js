import { Router } from 'express';
import { walletController } from '../controllers/walletController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

router.get('/', authMiddleware, walletController.getTransactions);
router.post('/adjust', authMiddleware, adminMiddleware, walletController.adjustBalance);

export default router;
