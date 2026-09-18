import Settings from '../models/Settings.js';
import { aiService } from '../services/aiService.js';
import { siteKnowledge } from '../services/aiKnowledge.js';

// In-memory or database aggregated AI statistics counter (Requirement 23)
const aiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  recentQuestions: [],
  startedAt: new Date().toISOString(),
};

export const aiController = {
  /**
   * Process user chat message
   */
  async chat(req, res) {
    try {
      const { message = '', history = [], image = null, cartContext = null } = req.body;

      if (!message.trim() && !image) {
        return res.status(400).json({ error: 'Xabar yoki rasm kiritilmadi.' });
      }

      aiStats.totalRequests += 1;
      if (message) {
        aiStats.recentQuestions.unshift({
          question: message.substring(0, 100),
          time: new Date().toISOString(),
          userId: req.user?._id || null,
        });
        if (aiStats.recentQuestions.length > 50) {
          aiStats.recentQuestions.pop();
        }
      }

      const result = await aiService.processChat({
        message,
        history,
        user: req.user || null,
        cartContext,
        image,
      });

      aiStats.successfulRequests += 1;
      return res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      console.error('AI chat controller error:', err);
      aiStats.failedRequests += 1;
      return res.status(500).json({
        error: 'AI xizmatida kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.',
      });
    }
  },

  /**
   * Get public AI settings
   */
  async getSettings(req, res) {
    try {
      const settings = await Settings.findOne();
      return res.json({
        aiSettings: settings?.aiSettings || {
          isEnabled: true,
          websiteQuestions: true,
          productRecommendations: true,
          orderAssistance: true,
          voiceAssistant: true,
          generalAiQuestions: true,
          imageUnderstanding: true,
        },
      });
    } catch (err) {
      console.error('Get AI settings error:', err);
      return res.status(500).json({ error: 'AI sozlamalarini yuklab bo‘lmadi.' });
    }
  },

  /**
   * Get structured site information
   */
  async getSiteInfo(req, res) {
    try {
      const settings = await Settings.findOne();
      return res.json({
        knowledge: {
          ...siteKnowledge,
          contacts: {
            ...siteKnowledge.contacts,
            phone: settings?.contactPhone || siteKnowledge.contacts.phone,
            telegram: settings?.contactTelegram || siteKnowledge.contacts.telegram,
            instagram: settings?.contactInstagram || siteKnowledge.contacts.instagram,
            address: settings?.contactAddress || siteKnowledge.contacts.address,
            workingHours: settings?.workingHours || siteKnowledge.contacts.workingHours,
          },
          delivery: {
            ...siteKnowledge.delivery,
            freeThreshold: settings?.freeDeliveryThreshold || siteKnowledge.delivery.freeThreshold,
            standardFee: settings?.deliveryFee || siteKnowledge.delivery.standardFee,
            outsideFee: settings?.deliveryFeeOutside || siteKnowledge.delivery.outsideFee,
          },
        },
      });
    } catch (err) {
      console.error('Get site info error:', err);
      return res.status(500).json({ error: 'Sayt ma’lumotlarini yuklab bo‘lmadi.' });
    }
  },

  /**
   * Get AI logs / usage stats for Admin
   */
  async getStats(req, res) {
    try {
      return res.json({
        stats: {
          ...aiStats,
          uptime: process.uptime(),
        },
      });
    } catch (err) {
      return res.status(500).json({ error: 'Statistikani yuklab bo‘lmadi.' });
    }
  },
};

export default aiController;
