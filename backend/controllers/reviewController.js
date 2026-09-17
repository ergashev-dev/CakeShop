import Review from '../models/Review.js';
import Order from '../models/Order.js';

export const reviewController = {
  /**
   * Get all verified reviews
   */
  async getReviews(req, res) {
    try {
      const { cakeId } = req.query;
      const filter = {};
      if (cakeId) filter.cakeId = cakeId;

      const reviews = await Review.find(filter);
      return res.json({ reviews });
    } catch (error) {
      console.error('Get reviews error:', error);
      return res.status(500).json({ error: 'Sharhlarni yuklashda xatolik yuz berdi.' });
    }
  },

  /**
   * Submit new review (Strictly for verified buyers with delivered order)
   */
  async createReview(req, res) {
    try {
      const { rating, comment, photo, cakeId, cakeName } = req.body;

      if (!rating || !comment) {
        return res.status(400).json({ error: 'Baho (1-5) va sharh matni talab qilinadi.' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Baho 1 dan 5 gacha bo‘lishi lozim.' });
      }

      // Check if user has an order with status 'delivered'
      const userId = req.user._id.toString();
      const deliveredOrders = await Order.find({ customer: userId, status: 'delivered' });

      if (!deliveredOrders || deliveredOrders.length === 0) {
        return res.status(403).json({
          error: 'Faqat buyurtmasi muvaffaqiyatli yetkazilgan tasdiqlangan xaridorlar sharh qoldira oladi.',
        });
      }

      const latestDelivered = deliveredOrders[0];

      const review = await Review.create({
        user: req.user._id,
        userName: req.user.name,
        userAvatar: '',
        orderId: latestDelivered.orderId,
        cakeId: cakeId || '',
        rating: Number(rating),
        comment: comment.trim(),
        photo: photo || '',
        isVerifiedBuyer: true,
      });

      return res.status(201).json({
        message: 'Sharhingiz muvaffaqiyatli qabul qilindi. Fikringiz uchun tashakkur!',
        review,
      });
    } catch (error) {
      console.error('Create review error:', error);
      return res.status(500).json({ error: 'Sharh qoldirishda xatolik yuz berdi.' });
    }
  },

  /**
   * Admin reply to review
   */
  async replyReview(req, res) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Javob matnini kiriting.' });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({ error: 'Sharh topilmadi.' });
      }

      review.adminReply = {
        text: text.trim(),
        repliedAt: new Date(),
        adminName: req.user.name,
      };

      await review.save();

      return res.json({
        message: 'Rasmiy javob muvaffaqiyatli saqlandi.',
        review,
      });
    } catch (error) {
      console.error('Reply review error:', error);
      return res.status(500).json({ error: 'Javob yozishda xatolik yuz berdi.' });
    }
  },
};
