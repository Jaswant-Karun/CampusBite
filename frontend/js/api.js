/**
 * CampusBite API Client Service
 */

const API_BASE = '/api';

const api = {
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('campusbite_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {}
    return headers;
  },

  async get(endpoint, params = {}) {
    try {
      const url = new URL(API_BASE + endpoint, window.location.origin);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      const res = await fetch(url, {
        headers: this.getHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.message || `GET ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = data;
        throw error;
      }
      return data;
    } catch (err) {
      console.error(`GET ${endpoint} failed:`, err);
      throw err;
    }
  },

  async post(endpoint, data = {}) {
    try {
      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `POST ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.error(`POST ${endpoint} failed:`, err);
      throw err;
    }
  },

  async put(endpoint, data = {}) {
    try {
      const res = await fetch(API_BASE + endpoint, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `PUT ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.error(`PUT ${endpoint} failed:`, err);
      throw err;
    }
  },

  async delete(endpoint) {
    try {
      const res = await fetch(API_BASE + endpoint, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `DELETE ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.error(`DELETE ${endpoint} failed:`, err);
      throw err;
    }
  },

  // Auth
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  checkAdmin: () => api.get('/auth/admin-check'),
  getProfile: (id) => api.get(`/auth/profile/${id}`),
  updateProfile: (id, data) => api.put(`/auth/profile/${id}`, data),

  // Categories
  getCategories: () => api.get('/categories'),

  // Products
  getProducts: (params) => api.get('/products', params),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Orders
  getOrders: (params) => api.get('/orders', params),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  simulatePayment: (data) => api.post('/orders/simulate-payment', data),

  // Coupons
  getCoupons: () => api.get('/coupons'),
  applyCoupon: (code, subtotal, already_applied_code) => api.post('/coupons/apply', { code, subtotal, already_applied_code }),
  createCoupon: (data) => api.post('/coupons', data),
  toggleCoupon: (id, is_active) => api.put(`/coupons/${id}`, { is_active }),

  // Loyalty
  getLoyalty: (userId) => api.get(`/loyalty/${userId}`),
  redeemLoyalty: (userId, points, credit_to_wallet = false) => api.post('/loyalty/redeem', { user_id: userId, points, credit_to_wallet }),

  // Reviews
  getReviews: (params) => api.get('/reviews', params),
  checkOrderReview: (orderId) => api.get(`/reviews/check/${orderId}`),
  submitReview: (data) => api.post('/reviews', data),

  // Analytics & BI
  getAnalytics: () => api.get('/analytics'),

  // AI Demand Prediction
  getDemandPrediction: () => api.get('/demand-prediction'),
  applyDemandPrep: (productId, prepAmount) => api.post('/demand-prediction/apply-prep', { productId, prepAmount }),

  // Demo Reset
  resetDemo: () => api.post('/reset-demo')
};

window.api = api;
