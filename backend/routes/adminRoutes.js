import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware, superAdminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Stats & Analytics
router.get('/stats', optionalAuthMiddleware, adminController.getDashboardStats);
router.get('/analytics', authMiddleware, adminMiddleware, adminController.getAnalyticsData);
router.get('/reports/export', authMiddleware, adminMiddleware, adminController.exportSalesReport);

// User Management
router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.put('/users/:id/block', authMiddleware, adminMiddleware, adminController.toggleBlockUser);
router.put('/users/:id/role', authMiddleware, superAdminMiddleware, adminController.changeUserRole);

// Staff Management (Super Admin)
router.get('/staff', authMiddleware, superAdminMiddleware, adminController.getStaff);
router.post('/staff', authMiddleware, superAdminMiddleware, adminController.createStaff);
router.delete('/staff/:id', authMiddleware, superAdminMiddleware, adminController.deleteStaff);

// Audit Logs
router.get('/logs', authMiddleware, adminMiddleware, adminController.getAuditLogs);

export default router;
