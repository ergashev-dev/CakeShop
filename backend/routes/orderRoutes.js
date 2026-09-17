import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware, confectionerMiddleware, courierMiddleware, staffMiddleware } from '../middleware/adminMiddleware.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Create order
router.post('/', paymentLimiter, optionalAuthMiddleware, orderController.createOrder);

// Customer order history
router.get('/user', authMiddleware, orderController.getUserOrders);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);

// Kitchen queue (Confectioner)
router.get('/kitchen', authMiddleware, confectionerMiddleware, orderController.getKitchenOrders);
router.patch('/kitchen/:id', authMiddleware, confectionerMiddleware, orderController.updateKitchenStatus);

// Courier queue (Courier)
router.get('/courier', authMiddleware, courierMiddleware, orderController.getCourierOrders);
router.post('/courier/:id/deliver', authMiddleware, courierMiddleware, orderController.confirmDelivery);

// Staff & Admin orders management
router.get('/', authMiddleware, staffMiddleware, orderController.getAllOrders);
router.get('/:id', authMiddleware, staffMiddleware, orderController.getOrderById);
router.put('/:id/status', authMiddleware, staffMiddleware, orderController.updateStatus);
router.patch('/:id/status', authMiddleware, staffMiddleware, orderController.updateStatus);

export default router;
