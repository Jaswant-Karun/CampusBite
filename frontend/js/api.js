/**
 * CampusBite API Client Service
 */

const API_BASE = '/api';

const api = {
  getBaseUrl() {
    const saved = localStorage.getItem('campusbite_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '') + '/api';
    }
    const isNative = window.location.protocol === 'capacitor:' || 
                     window.location.protocol === 'file:' || 
                     (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '');
    if (isNative) {
      return 'http://192.168.1.36:3000/api';
    }
    return '/api';
  },

  getServerHost() {
    const saved = localStorage.getItem('campusbite_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
    const isNative = window.location.protocol === 'capacitor:' || 
                     window.location.protocol === 'file:' || 
                     (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '');
    if (isNative) {
      return 'http://192.168.1.36:3000';
    }
    return window.location.origin;
  },

  setServerUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('campusbite_backend_url', url.trim());
    } else {
      localStorage.removeItem('campusbite_backend_url');
    }
  },

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
      const base = this.getBaseUrl();
      const host = this.getServerHost();
      const url = base.startsWith('http') ? new URL(base + endpoint) : new URL(base + endpoint, host);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      const res = await fetch(url.toString(), {
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
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await fetch(fullUrl, {
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
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await fetch(fullUrl, {
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
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await fetch(fullUrl, {
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
  // Coupons (Step 23)
  getCoupons: () => api.get('/coupons'),
  getCoupon: (id) => api.get(`/coupons/${id}`),
  applyCoupon: (code, subtotal, already_applied_code) => api.post('/coupons/apply', { code, subtotal, already_applied_code }),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  toggleCoupon: (id, is_active) => api.put(`/coupons/${id}`, { is_active }),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),

  // Loyalty
  getLoyalty: (userId) => api.get(`/loyalty/${userId}`),
  redeemLoyalty: (userId, points, credit_to_wallet = false) => api.post('/loyalty/redeem', { user_id: userId, points, credit_to_wallet }),

  // Reviews
  getReviews: (params) => api.get('/reviews', params),
  checkOrderReview: (orderId) => api.get(`/reviews/check/${orderId}`),
  submitReview: (data) => api.post('/reviews', data),

  // Analytics & BI (Step 24)
  getAnalytics: (params) => api.get('/analytics', params),

  // Customers (Step 22)
  getCustomers: (params) => api.get('/customers', params),
  getCustomerDetails: (id) => api.get(`/customers/${id}`),

  // Smart Demand Insight (Step 25)
  getSmartDemandInsights: () => api.get('/smart-demand'),
  getDemandPrediction: () => api.get('/smart-demand'),
  applyDemandPrep: (productId, prepAmount) => api.post('/smart-demand/apply-prep', { productId, prepAmount }),

  // Demo Reset
  resetDemo: () => api.post('/reset-demo')
};

window.api = api;
