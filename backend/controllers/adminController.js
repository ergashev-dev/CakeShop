import bcrypt from 'bcryptjs';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Cake from '../models/Cake.js';
import Category from '../models/Category.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AdminLog from '../models/AdminLog.js';

/**
 * Helper to calculate date boundaries
 */
function getDateRange(range) {
  const now = new Date();
  let start = new Date(0); // beginning of time
  let end = new Date();

  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'yesterday') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30days') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '3months') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end };
}

export const adminController = {
  /**
   * Real calculated dashboard metrics
   */
  async getDashboardStats(req, res) {
    try {
      const { range = '30days' } = req.query;
      const { start, end } = getDateRange(range);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Filtered orders query
      const rangeOrders = await Order.find({ createdAt: { $gte: start, $lte: end } });
      const allOrders = await Order.find();
      const todayOrdersList = await Order.find({ createdAt: { $gte: todayStart } });

      // Revenue computations
      const validCompleted = (ord) => ord.status !== 'cancelled';
      const rangeRevenue = rangeOrders.filter(validCompleted).reduce((sum, o) => sum + (o.total || 0), 0);
      const todayRevenue = todayOrdersList.filter(validCompleted).reduce((sum, o) => sum + (o.total || 0), 0);
      const totalRevenue = allOrders.filter(validCompleted).reduce((sum, o) => sum + (o.total || 0), 0);

      // Counts
      const totalOrders = allOrders.length;
      const rangeOrdersCount = rangeOrders.length;
      const todayOrdersCount = todayOrdersList.length;
      const completedOrders = allOrders.filter((o) => o.status === 'delivered').length;
      const cancelledOrders = allOrders.filter((o) => o.status === 'cancelled').length;
      const pendingOrders = allOrders.filter((o) => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status)).length;

      const averageOrderValue = rangeOrdersCount > 0 ? Math.round(rangeRevenue / rangeOrdersCount) : 0;

      // Products & Users
      const activeCakes = await Cake.countDocuments({ isActive: true });
      const totalUsers = await User.countDocuments({ role: ['customer', 'user'] });
      const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });

      // Recent 10 orders
      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

      return res.json({
        stats: {
          totalRevenue,
          rangeRevenue,
          todayRevenue,
          totalOrders,
          rangeOrdersCount,
          todayOrdersCount,
          completedOrders,
          cancelledOrders,
          pendingOrders,
          averageOrderValue,
          activeCakes,
          totalUsers,
          newUsers,
        },
        recentOrders,
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({ error: 'Statistika ma‘lumotlarini yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Analytics Charts Data (Area Chart, Donut, Bar Chart)
   */
  async getAnalyticsData(req, res) {
    try {
      const { range = '30days' } = req.query;
      const { start, end } = getDateRange(range);

      const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });

      // 1. Daily timeline for Area Chart
      const dailyMap = {};
      const daysCount = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));

      // Initialize empty days
      for (let i = 0; i < Math.min(daysCount, 30); i++) {
        const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(5, 10); // MM-DD
        dailyMap[key] = { date: key, revenue: 0, orders: 0 };
      }

      orders.forEach((o) => {
        if (o.status !== 'cancelled' && o.createdAt) {
          const d = new Date(o.createdAt);
          const key = d.toISOString().slice(5, 10);
          if (!dailyMap[key]) {
            dailyMap[key] = { date: key, revenue: 0, orders: 0 };
          }
          dailyMap[key].revenue += o.total || 0;
          dailyMap[key].orders += 1;
        }
      });

      const timeline = Object.values(dailyMap);

      // 2. Category Sales Distribution (Donut Chart)
      const categoryMap = {};
      orders.forEach((o) => {
        if (o.status !== 'cancelled' && o.items) {
          o.items.forEach((item) => {
            const cat = item.category_name || item.name || 'Boshqa';
            categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * (item.quantity || 1));
          });
        }
      });

      const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));

      // 3. Order Status Breakdown (Bar Chart)
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        delivering: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((o) => {
        if (statusCounts[o.status] !== undefined) {
          statusCounts[o.status] += 1;
        }
      });

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      return res.json({
        timeline,
        categoryDistribution,
        statusDistribution,
      });
    } catch (error) {
      console.error('Analytics data error:', error);
      return res.status(500).json({ error: 'Analitika ma‘lumotlarini yuklashda xatolik.' });
    }
  },

  /**
   * Export Sales Report (Excel / CSV ready)
   */
  async exportSalesReport(req, res) {
    try {
      const { range = '30days' } = req.query;
      const { start, end } = getDateRange(range);

      const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });

      let csv = 'Buyurtma ID,Mijoz,Telefon,Manzil,Mahsulotlar soni,Summa (so\'m),Yetkazish,Chegirma,Jami,Holat,Sana\n';

      orders.forEach((o) => {
        const cleanName = (o.customer_name || '').replace(/,/g, ' ');
        const cleanPhone = (o.customer_phone || '').replace(/,/g, ' ');
        const cleanAddress = (o.customer_address || '').replace(/,/g, ' ');
        const itemsCount = o.items ? o.items.length : 0;
        const dateStr = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '';

        csv += `${o.orderId},${cleanName},${cleanPhone},"${cleanAddress}",${itemsCount},${o.subtotal},${o.delivery_fee || 0},${o.discount || 0},${o.total},${o.status},${dateStr}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="bol_tortlari_hisobot_${range}.csv"`);
      return res.send(csv);
    } catch (error) {
      console.error('Export report error:', error);
      return res.status(500).json({ error: 'Hisobotni eksport qilishda xatolik.' });
    }
  },

  /**
   * Get all registered users (Customers)
   */
  async getUsers(req, res) {
    try {
      const { search, role, page = 1, limit = 50 } = req.query;
      const filter = {};
      if (role && role !== 'all') filter.role = role;

      let users = await User.find(filter);

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q))
        );
      }

      return res.json({ users });
    } catch (error) {
      return res.status(500).json({ error: 'Foydalanuvchilar ro‘yxatini yuklashda xatolik.' });
    }
  },

  /**
   * Staff Management: Get staff list (Admin, Confectioner, Courier)
   */
  async getStaff(req, res) {
    try {
      const staffRoles = ['superadmin', 'super_admin', 'admin', 'confectioner', 'courier'];
      const users = await User.find({ role: staffRoles });
      return res.json({ staff: users });
    } catch (error) {
      return res.status(500).json({ error: 'Xodimlar ro‘yxatini yuklashda xatolik.' });
    }
  },

  /**
   * Staff Management: Create Staff Member (Super Admin Only)
   */
  async createStaff(req, res) {
    try {
      if (!['superadmin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Faqat Bosh Administrator yangi xodim yarata oladi.' });
      }

      const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Ism, email, parol va xodim roli kiritilishi shart.' });
      }

      if (!['admin', 'confectioner', 'courier'].includes(role)) {
        return res.status(400).json({ error: 'Noto‘g‘ri xodim roli tanlandi.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'Ushbu email bilan allaqachon hisob mavjud.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const staffMember = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : '',
        role,
        isVerified: true,
      });

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'create_staff',
        target: staffMember.email,
        details: `Yangi xodim yaratildi: ${staffMember.name} (Rol: ${role})`,
        ipAddress: req.ip || '',
      });

      return res.status(201).json({
        message: 'Yangi xodim muvaffaqiyatli yaratildi.',
        staff: staffMember.toJSON(),
      });
    } catch (error) {
      console.error('Create staff error:', error);
      return res.status(500).json({ error: 'Xodim yaratishda xatolik.' });
    }
  },

  /**
   * Staff Management: Delete Staff Member (Super Admin Only)
   */
  async deleteStaff(req, res) {
    try {
      if (!['superadmin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Faqat Bosh Administrator xodimni o‘chira oladi.' });
      }

      const { id } = req.params;
      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Xodim topilmadi.' });
      }

      if (['superadmin', 'super_admin'].includes(targetUser.role) || targetUser.email === 'eabdurashid72@gmail.com') {
        return res.status(403).json({ error: 'Bosh Administratorni (Super Admin) o‘chirish mumkin emas.' });
      }

      await User.deleteOne({ _id: id });

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'delete_staff',
        target: targetUser.email,
        details: `Xodim o‘chirildi: ${targetUser.name} (${targetUser.role})`,
        ipAddress: req.ip || '',
      });

      return res.json({ message: 'Xodim hisobi o‘chirildi.' });
    } catch (error) {
      return res.status(500).json({ error: 'O‘chirishda xatolik.' });
    }
  },

  /**
   * Block / Unblock user
   */
  async toggleBlockUser(req, res) {
    try {
      const { id } = req.params;
      const targetUser = await User.findById(id);

      if (!targetUser) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      if (['superadmin', 'super_admin'].includes(targetUser.role) || targetUser.email === 'eabdurashid72@gmail.com') {
        return res.status(403).json({ error: 'Bosh Administratorni (Super Admin) bloklash mumkin emas.' });
      }

      targetUser.isBlocked = !targetUser.isBlocked;
      await targetUser.save();

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: targetUser.isBlocked ? 'block_user' : 'unblock_user',
        target: targetUser.email,
        details: `Foydalanuvchi ${targetUser.name} (${targetUser.email}) ${targetUser.isBlocked ? 'bloklandi' : 'blokdan chiqarildi'}.`,
        ipAddress: req.ip || '',
      });

      return res.json({
        message: targetUser.isBlocked ? 'Foydalanuvchi bloklandi.' : 'Foydalanuvchi blokdan chiqarildi.',
        user: targetUser,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Amalni bajarishda xatolik yuz berdi.' });
    }
  },

  /**
   * Change Role (Super Admin Only)
   */
  async changeUserRole(req, res) {
    try {
      if (!['superadmin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Rollar boshqaruvi faqat Bosh Administrator ruxsatida.' });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'confectioner', 'courier', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'Noto‘g‘ri rol tanlandi.' });
      }

      const targetUser = await User.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      if (['superadmin', 'super_admin'].includes(targetUser.role)) {
        return res.status(403).json({ error: 'Super Admin roliga o‘zgartirish kiritish mumkin emas.' });
      }

      const previousRole = targetUser.role;
      targetUser.role = role;
      await targetUser.save();

      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'change_role',
        target: targetUser.email,
        details: `${targetUser.name} (${targetUser.email}) roli "${previousRole}"dan "${role}"ga o‘zgartirildi.`,
        ipAddress: req.ip || '',
      });

      return res.json({
        message: `Foydalanuvchi roli "${role}"ga o‘zgartirildi.`,
        user: targetUser,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Rolni o‘zgartirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Get Admin Audit Logs
   */
  async getAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const total = await AdminLog.countDocuments();
      const logs = await AdminLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Audit loglarini yuklashda xatolik yuz berdi.' });
    }
  },
};
