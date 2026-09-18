import api from '../api';
import siteKnowledge from './miraKnowledge';

export const miraApi = {
  /**
   * Send user message to AI backend
   */
  async sendMessage({ message, history = [], image = null, cartContext = null }) {
    try {
      const response = await api.post('/ai/chat', {
        message,
        history,
        image,
        cartContext,
      });
      return response.data;
    } catch (error) {
      console.warn('miraApi.sendMessage error:', error);
      // Fallback for network error or server down
      const isNetworkError = !error.response;
      return {
        success: false,
        isFallback: true,
        reply: isNetworkError
          ? 'Internet aloqasida muammo yuz berdi. Iltimos, internetni tekshirib qayta urinib ko‘ring yoki to‘g‘ridan-to‘g‘ri katalogimizdan foydalaning.'
          : (error.response?.data?.error || 'Kechirasiz, hozir javob bera olmadim. Iltimos, birozdan so‘ng qayta urinib ko‘ring.'),
        products: [],
        action: null,
      };
    }
  },

  /**
   * Get public AI settings
   */
  async getSettings() {
    try {
      const response = await api.get('/ai/settings');
      return response.data?.aiSettings || { isEnabled: true };
    } catch (error) {
      return { isEnabled: true };
    }
  },

  /**
   * Get site structured information
   */
  async getSiteInfo() {
    try {
      const response = await api.get('/ai/site-info');
      return response.data?.knowledge || siteKnowledge;
    } catch (error) {
      return siteKnowledge;
    }
  },

  /**
   * Get AI stats for Admin
   */
  async getStats() {
    try {
      const response = await api.get('/ai/stats');
      return response.data?.stats || null;
    } catch (error) {
      return null;
    }
  },
};

export default miraApi;
