import { Router } from 'express';
import { cakeController } from '../controllers/cakeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public routes
router.get('/', cakeController.getCakes);
router.get('/:id', cakeController.getCakeById);

// Admin protected routes
router.post('/', authMiddleware, adminMiddleware, cakeController.createCake);
router.put('/:id', authMiddleware, adminMiddleware, cakeController.updateCake);
router.delete('/:id', authMiddleware, adminMiddleware, cakeController.deleteCake);

export default router;
