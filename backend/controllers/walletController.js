import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AdminLog from '../models/AdminLog.js';

export const walletController = {
  /**
   * Get wallet transactions for user or admin
   */
  async getTransactions(req, res) {
    try {
      const { userId, page = 1, limit = 20 } = req.query;

      const filter = {};
      if (req.user.role === 'customer') {
        filter.user = req.user._id;
      } else if (userId) {
        filter.user = userId;
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const total = await WalletTransaction.countDocuments(filter);
      const transactions = await WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .populate('user', 'name email phone')
        .skip(skip)
        .limit(limitNum);

      return res.json({
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Hamyon tarixini yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Adjust user balance by Admin / Super Admin
   */
  async adjustBalance(req, res) {
    try {
      const { userId, amount, reason } = req.body;

      if (!userId || amount === undefined || !reason || !reason.trim()) {
        return res.status(400).json({ error: 'Foydalanuvchi, summa va majburiy sabab kiritilishi shart.' });
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount === 0) {
        return res.status(400).json({ error: 'Summa 0 dan farqli to‘g‘ri son bo‘lishi lozim.' });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      }

      const newBalance = targetUser.walletBalance + numericAmount;
      if (newBalance < 0) {
        return res.status(400).json({
          error: `Balans manfiy bo‘lib qolishi mumkin emas. Foydalanuvchi joriy balansi: ${targetUser.walletBalance.toLocaleString()} so‘m.`,
        });
      }

      targetUser.walletBalance = newBalance;
      await targetUser.save();

      const transaction = await WalletTransaction.create({
        user: targetUser._id,
        amount: numericAmount,
        type: numericAmount > 0 ? 'deposit' : 'withdraw',
        reason: reason.trim(),
        balanceAfter: newBalance,
        createdBy: req.user._id,
      });

      // Send Notification to user
      const isPositive = numericAmount > 0;
      await Notification.create({
        recipient: targetUser._id,
        recipientRole: 'user',
        type: isPositive ? 'wallet_added' : 'wallet_removed',
        title: isPositive ? 'Hamyoningiz to‘ldirildi' : 'Hamyondan mablag‘ yechildi',
        message: `${Math.abs(numericAmount).toLocaleString()} so‘m (${reason.trim()}). Yangi balans: ${newBalance.toLocaleString()} so‘m.`,
      });

      // Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'adjust_balance',
        target: targetUser.email,
        details: `${targetUser.name} hisobiga ${numericAmount > 0 ? '+' : ''}${numericAmount.toLocaleString()} so‘m o‘zgartirildi. Sabab: "${reason.trim()}"`,
        ipAddress: req.ip || '',
      });

      return res.json({
        message: 'Foydalanuvchi balansi muvaffaqiyatli o‘zgartirildi!',
        walletBalance: newBalance,
        transaction,
      });
    } catch (error) {
      console.error('Adjust balance error:', error.message);
      return res.status(500).json({ error: 'Balansni o‘zgartirishda xatolik yuz berdi.' });
    }
  },
};
