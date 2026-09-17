import express from 'express';
import { bugController } from '../controllers/bugController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', optionalAuthMiddleware, bugController.createBugReport);
router.get('/', authMiddleware, adminMiddleware, bugController.getBugReports);
router.patch('/:id', authMiddleware, adminMiddleware, bugController.updateBugStatus);

export default router;
