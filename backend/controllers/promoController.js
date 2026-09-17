import PromoCode from '../models/PromoCode.js';

export const promoController = {
  /**
   * Get all promo codes (Admin)
   */
  async getPromoCodes(req, res) {
    try {
      const promos = await PromoCode.find();
      return res.json({ promos });
    } catch (error) {
      return res.status(500).json({ error: 'Promokodlarni yuklashda xatolik.' });
    }
  },

  /**
   * Create promo code (Admin)
   */
  async createPromoCode(req, res) {
    try {
      const { code, discountPercent, discountAmount, minOrderAmount, maxUses, expiresAt } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Promokod matni talab qilinadi.' });
      }

      const existing = await PromoCode.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        return res.status(409).json({ error: 'Ushbu promokod allaqachon mavjud.' });
      }

      const promo = await PromoCode.create({
        code: code.toUpperCase().trim(),
        discountPercent: Number(discountPercent) || 0,
        discountAmount: Number(discountAmount) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxUses: Number(maxUses) || 0,
        expiresAt: expiresAt || null,
        isActive: true,
      });

      return res.status(201).json({ message: 'Promokod muvaffaqiyatli yaratildi.', promo });
    } catch (error) {
      return res.status(500).json({ error: 'Promokod yaratishda xatolik.' });
    }
  },

  /**
   * Delete promo code (Admin)
   */
  async deletePromoCode(req, res) {
    try {
      const { id } = req.params;
      await PromoCode.deleteOne({ _id: id });
      return res.json({ message: 'Promokod o‘chirildi.' });
    } catch (error) {
      return res.status(500).json({ error: 'O‘chirishda xatolik.' });
    }
  },

  /**
   * Validate promo code (Customer Checkout)
   */
  async validatePromoCode(req, res) {
    try {
      const { code, subtotal } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Promokod kiritilmagan.' });
      }

      const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });
      if (!promo || !promo.isActive) {
        return res.status(404).json({ error: 'Bunday promokod mavjud emas yoki muddati tugagan.' });
      }

      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Promokodning amal qilish muddati tugagan.' });
      }

      if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ error: 'Ushbu promokoddan foydalanish limiti tugagan.' });
      }

      const orderAmount = Number(subtotal) || 0;
      if (promo.minOrderAmount > 0 && orderAmount < promo.minOrderAmount) {
        return res.status(400).json({
          error: `Ushbu promokod faqat kamida ${promo.minOrderAmount.toLocaleString()} so‘mlik buyurtmalar uchun amal qiladi.`,
        });
      }

      let discount = 0;
      if (promo.discountPercent > 0) {
        discount = Math.round((orderAmount * promo.discountPercent) / 100);
      } else if (promo.discountAmount > 0) {
        discount = promo.discountAmount;
      }

      discount = Math.min(discount, orderAmount);

      return res.json({
        valid: true,
        code: promo.code,
        discount,
        message: `Promokod qo‘llandi! Chegirma: ${discount.toLocaleString()} so‘m`,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Promokodni tekshirishda xatolik.' });
    }
  },
};
