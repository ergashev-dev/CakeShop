import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);
router.post('/broadcast', authMiddleware, adminMiddleware, notificationController.broadcastNotification);

export default router;
