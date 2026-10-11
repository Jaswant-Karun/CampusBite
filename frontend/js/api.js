/**
 * CampusBite API Client Service
 * High-performance, resilient networking layer with native Capacitor detection,
 * configurable timeout abort controllers, and offline Stale-While-Revalidate caching.
 */

const DEFAULT_LAN_SERVER = 'http://192.168.1.36:3000';

const api = {
  isNativeApp() {
    if (typeof window === 'undefined') return false;
    if (window.Capacitor !== undefined) return true;
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') return true;
    // Android Capacitor WebView serves from localhost with no port or arbitrary port
    if (window.location.hostname === 'localhost' && window.location.port !== '3000') return true;
    return false;
  },

  getBaseUrl() {
    const saved = localStorage.getItem('campusbite_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '') + '/api';
    }
    if (this.isNativeApp()) {
      return DEFAULT_LAN_SERVER + '/api';
    }
    return '/api';
  },

  getServerHost() {
    const saved = localStorage.getItem('campusbite_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
    if (this.isNativeApp()) {
      return DEFAULT_LAN_SERVER;
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

  async fetchWithTimeout(url, options = {}, timeoutMs = 3800) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timed out (${timeoutMs}ms)`);
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    }
  },

  async get(endpoint, params = {}, options = {}) {
    const cacheKey = 'cb_cache_' + endpoint;
    const timeoutMs = options.timeout || 3800;
    try {
      const base = this.getBaseUrl();
      const host = this.getServerHost();
      const url = base.startsWith('http') ? new URL(base + endpoint) : new URL(base + endpoint, host);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const res = await this.fetchWithTimeout(url.toString(), {
        headers: this.getHeaders()
      }, timeoutMs);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.message || `GET ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      // Cache successful response for fast offline rendering
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}

      return data;
    } catch (err) {
      // Check cache fallback
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.warn(`[Network Fallback] Serving cached data for GET ${endpoint}:`, err.message);
          return JSON.parse(cached);
        }
      } catch (cacheErr) {}

      console.warn(`GET ${endpoint} network call failed:`, err.message);
      throw err;
    }
  },

  async post(endpoint, data = {}, options = {}) {
    const timeoutMs = options.timeout || 6500;
    try {
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await this.fetchWithTimeout(fullUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }, timeoutMs);

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `POST ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.warn(`POST ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  async put(endpoint, data = {}, options = {}) {
    const timeoutMs = options.timeout || 6500;
    try {
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await this.fetchWithTimeout(fullUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }, timeoutMs);

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `PUT ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.warn(`PUT ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  async delete(endpoint, options = {}) {
    const timeoutMs = options.timeout || 6500;
    try {
      const base = this.getBaseUrl();
      const fullUrl = base.startsWith('http') ? (base + endpoint) : (this.getServerHost() + base + endpoint);
      const res = await this.fetchWithTimeout(fullUrl, {
        method: 'DELETE',
        headers: this.getHeaders()
      }, timeoutMs);

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(resData.message || `DELETE ${endpoint} failed (${res.status})`);
        error.status = res.status;
        error.data = resData;
        throw error;
      }
      return resData;
    } catch (err) {
      console.warn(`DELETE ${endpoint} failed:`, err.message);
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
  getAnalytics: (params) => api.get('/analytics'),

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

window.promptServerUrl = function() {
  const current = window.api.getServerHost();
  const input = prompt("CampusBite Canteen Server Address:\n\nDefault: " + DEFAULT_LAN_SERVER + "\n(Enter your PC's Wi-Fi IP if different):", current);
  if (input !== null) {
    if (input.trim()) {
      window.api.setServerUrl(input.trim());
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast("Backend connection updated: " + input.trim(), "success");
      }
      setTimeout(() => window.location.reload(), 400);
    } else {
      window.api.setServerUrl('');
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast("Reset to default connection (" + DEFAULT_LAN_SERVER + ")", "info");
      }
      setTimeout(() => window.location.reload(), 400);
    }
  }
};
