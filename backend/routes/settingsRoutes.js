import express from 'express';
import { settingsController } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { superAdminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', settingsController.getSettings);
router.patch('/', authMiddleware, superAdminMiddleware, settingsController.updateSettings);

export default router;
