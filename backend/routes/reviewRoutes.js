import express from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', reviewController.getReviews);
router.post('/', authMiddleware, reviewController.createReview);
router.post('/:id/reply', authMiddleware, adminMiddleware, reviewController.replyReview);
router.delete('/:id', authMiddleware, adminMiddleware, reviewController.deleteReview);

export default router;
