import Settings from '../models/Settings.js';
import AdminLog from '../models/AdminLog.js';

export const settingsController = {
  /**
   * Get public store settings
   */
  async getSettings(req, res) {
    try {
      const settings = (await Settings.findOne()) || (await Settings.create({}));
      return res.json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({ error: 'Sozlamalarni yuklashda xatolik.' });
    }
  },

  /**
   * Update store settings (Super Admin only)
   */
  async updateSettings(req, res) {
    try {
      const {
        isStoreOpen,
        cashbackPercent,
        deliveryFee,
        deliveryFeeOutside,
        freeDeliveryThreshold,
        workingHours,
        contactPhone,
        contactTelegram,
        contactAddress,
      } = req.body;

      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({});
      }

      if (isStoreOpen !== undefined) settings.isStoreOpen = Boolean(isStoreOpen);
      if (cashbackPercent !== undefined) settings.cashbackPercent = Number(cashbackPercent);
      if (deliveryFee !== undefined) settings.deliveryFee = Number(deliveryFee);
      if (deliveryFeeOutside !== undefined) settings.deliveryFeeOutside = Number(deliveryFeeOutside);
      if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
      if (workingHours) settings.workingHours = workingHours.trim();
      if (contactPhone) settings.contactPhone = contactPhone.trim();
      if (contactTelegram) settings.contactTelegram = contactTelegram.trim();
      if (contactAddress) settings.contactAddress = contactAddress.trim();

      await settings.save();

      // Audit Log
      await AdminLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        action: 'update_settings',
        target: 'Store Settings',
        details: 'Tizim va do‘kon sozlamalari yangilandi',
        ipAddress: req.ip || '',
      });

      return res.json({
        message: 'Tizim sozlamalari muvaffaqiyatli saqlandi.',
        settings,
      });
    } catch (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({ error: 'Sozlamalarni yangilashda xatolik.' });
    }
  },
};
