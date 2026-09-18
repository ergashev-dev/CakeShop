import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bol_tortlari_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-clear token on 401 Unauthorized (1-day expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentToken = localStorage.getItem('bol_tortlari_token');
      if (currentToken) {
        localStorage.removeItem('bol_tortlari_token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (login, password) => api.post('/auth/login', { login, password }),
  googleTokenLogin: (credential) => api.post('/auth/google/token', { credential }),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  resendCode: (email) => api.post('/auth/resend-code', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email, code, newPassword, confirmPassword) =>
    api.post('/auth/reset-password', { email, code, newPassword, confirmPassword }),
  checkUsername: (username) => api.get('/auth/check-username', { params: { username } }),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getAddresses: () => api.get('/auth/addresses'),
  addAddress: (data) => api.post('/auth/addresses', data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
};

export const cakeApi = {
  getAll: (params) => api.get('/cakes', { params }),
  getById: (id) => api.get(`/cakes/${id}`),
  create: (data) => api.post('/cakes', data),
  update: (id, data) => api.put(`/cakes/${id}`, data),
  delete: (id) => api.delete(`/cakes/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getUserOrders: () => api.get('/orders/user'),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  // Kitchen
  getKitchenOrders: () => api.get('/orders/kitchen'),
  updateKitchenStatus: (id, status, kitchenNotes) =>
    api.patch(`/orders/kitchen/${id}`, { status, kitchenNotes }),
  // Courier
  getCourierOrders: () => api.get('/orders/courier'),
  confirmDelivery: (id) => api.post(`/orders/courier/${id}/deliver`),
};

export const userApi = {
  getFavorites: () => api.get('/users/favorites'),
  toggleFavorite: (cakeId) => api.post(`/users/favorites/${cakeId}`),
  getTelegramLinkToken: () => api.get('/users/telegram-link-token'),
  unlinkTelegram: () => api.post('/users/telegram-unlink'),
};

export const walletApi = {
  getTransactions: (params) => api.get('/wallet', { params }),
  adjustBalance: (userId, amount, reason) =>
    api.post('/wallet/adjust', { userId, amount, reason }),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export const reviewApi = {
  getAll: (cakeId) => api.get('/reviews', { params: { cakeId } }),
  create: (data) => api.post('/reviews', data),
  reply: (id, text) => api.post(`/reviews/${id}/reply`, { text }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const bugApi = {
  create: (data) => api.post('/bugs', data),
  getAll: (status) => api.get('/bugs', { params: { status } }),
  updateStatus: (id, status, adminNotes) => api.patch(`/bugs/${id}`, { status, adminNotes }),
};

export const promoApi = {
  validate: (code, subtotal) => api.post('/promos/validate', { code, subtotal }),
  getAll: () => api.get('/promos'),
  create: (data) => api.post('/promos', data),
  delete: (id) => api.delete(`/promos/${id}`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.patch('/settings', data),
};

export const adminApi = {
  getStats: (range = '30days') => api.get('/admin/stats', { params: { range } }),
  getAnalytics: (range = '30days') => api.get('/admin/analytics', { params: { range } }),
  exportReportUrl: (range = '30days') => `${API_BASE_URL}/admin/reports/export?range=${range}`,
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleBlockUser: (id) => api.put(`/admin/users/${id}/block`),
  changeUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
};

export const paymentApi = {
  getConfig: () => api.get('/payment/config'),
  createPaymentUrl: (data) => api.post('/payment/checkout-url', data),
  processCardPayment: (data) => api.post('/payment/card', data),
};

export default api;
