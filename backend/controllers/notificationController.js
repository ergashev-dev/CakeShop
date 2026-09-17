import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { socketService } from '../services/socketService.js';

export const notificationController = {
  /**
   * Get notifications for authenticated user or admin
   */
  async getNotifications(req, res) {
    try {
      const user = req.user;
      const role = user.role;

      const filter = {
        $or: [
          { recipient: user._id },
          { recipientRole: 'all' },
          { recipientRole: role === 'super_admin' ? 'admins' : role === 'admin' ? 'admins' : 'customers' },
        ],
      };

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return res.json({ notifications, unreadCount });
    } catch (error) {
      return res.status(500).json({ error: 'Bildirishnomalarni yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await Notification.findByIdAndUpdate(id, { isRead: true });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Xatolik yuz berdi.' });
    }
  },

  /**
   * Super Admin broadcast notification
   */
  async broadcastNotification(req, res) {
    try {
      const { title, message, targetGroup, targetUserId } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Sarlavha va xabar matni majburiy.' });
      }

      let notif;
      if (targetGroup === 'user' && targetUserId) {
        notif = await Notification.create({
          recipient: targetUserId,
          recipientRole: 'user',
          type: 'system',
          title: title.trim(),
          message: message.trim(),
        });
        socketService.emitNotification(targetUserId, notif);
      } else {
        const group = ['all', 'admins', 'customers'].includes(targetGroup) ? targetGroup : 'all';
        notif = await Notification.create({
          recipientRole: group,
          type: 'system',
          title: title.trim(),
          message: message.trim(),
        });
        socketService.emitNotification(group, notif);
      }

      // Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'broadcast_notification',
        target: targetGroup || 'all',
        details: `Bildirishnoma yuborildi: "${title.trim()}" (${targetGroup})`,
        ipAddress: req.ip || '',
      });

      return res.status(201).json({
        message: 'Xabarnoma muvaffaqiyatli tarqatildi!',
        notification: notif,
      });
    } catch (error) {
      console.error('Broadcast notification error:', error.message);
      return res.status(500).json({ error: 'Xabarnoma tarqatishda xatolik yuz berdi.' });
    }
  },
};
