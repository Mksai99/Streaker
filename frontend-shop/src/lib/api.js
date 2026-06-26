const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('streakify_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    // Safely parse JSON — handle empty or non-JSON responses
    let data;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(text || `Server error (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  get(endpoint) { return this.request(endpoint); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Shop API
export const shopApi = {
  create: (data) => api.post('/shops', data),
  getAll: (params) => api.get(`/shops?${new URLSearchParams(params)}`),
  getMyShops: () => api.get('/shops/my-shops'),
  getById: (id) => api.get(`/shops/${id}`),
  update: (id, data) => api.put(`/shops/${id}`, data),
  delete: (id) => api.delete(`/shops/${id}`),
  getCustomers: (shopId, params) => api.get(`/shops/${shopId}/customers?${new URLSearchParams(params)}`),
};

// Product API
export const productApi = {
  createCategory: (shopId, data) => api.post(`/products/categories/${shopId}`, data),
  getCategories: (shopId) => api.get(`/products/categories/${shopId}`),
  updateCategory: (id, data) => api.put(`/products/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/products/categories/${id}`),
  
  createProduct: (shopId, data) => api.post(`/products/${shopId}`, data),
  getProducts: (shopId, params) => api.get(`/products/shop/${shopId}?${new URLSearchParams(params || {})}`),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Offer API
export const offerApi = {
  create: (shopId, data) => api.post(`/offers/${shopId}`, data),
  getByShop: (shopId) => api.get(`/offers/shop/${shopId}`),
  update: (id, data) => api.put(`/offers/${id}`, data),
  delete: (id) => api.delete(`/offers/${id}`),
};

// Visit API
export const visitApi = {
  scanQR: (data) => api.post('/visits/scan', data),
  recordVisit: (data) => api.post('/visits/record', data),
  getUserVisits: (userId, params) => api.get(`/visits/user/${userId}?${new URLSearchParams(params)}`),
  getShopVisits: (shopId, params) => api.get(`/visits/shop/${shopId}?${new URLSearchParams(params)}`),
};

// Reward API
export const rewardApi = {
  create: (shopId, data) => api.post(`/rewards/${shopId}`, data),
  getByShop: (shopId, params) => api.get(`/rewards/shop/${shopId}?${new URLSearchParams(params)}`),
  getUserRewards: () => api.get('/rewards/user/available'),
  getById: (id) => api.get(`/rewards/${id}`),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  delete: (id) => api.delete(`/rewards/${id}`),
  claim: (id) => api.post(`/rewards/${id}/claim`),
  getClaims: (shopId, params) => api.get(`/rewards/claims/${shopId}?${new URLSearchParams(params)}`),
  approveClaim: (claimId) => api.put(`/rewards/claims/${claimId}/approve`),
};

// Notification API
export const notificationApi = {
  getAll: (params) => api.get(`/notifications?${new URLSearchParams(params)}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Analytics API
export const analyticsApi = {
  getShopAnalytics: (shopId) => api.get(`/analytics/shop/${shopId}`),
  getCustomerAnalytics: () => api.get('/analytics/customer'),
  getPlatformAnalytics: () => api.get('/analytics/platform'),
};

// Admin API
export const adminApi = {
  getUsers: (params) => api.get(`/admin/users?${new URLSearchParams(params)}`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getShops: (params) => api.get(`/admin/shops?${new URLSearchParams(params)}`),
  approveShop: (id) => api.put(`/admin/shops/${id}/approve`),
  suspendShop: (id) => api.put(`/admin/shops/${id}/suspend`),
  getAnalytics: () => api.get('/admin/analytics'),
  getLogs: (params) => api.get(`/admin/logs?${new URLSearchParams(params)}`),
};

// Gallery API
export const galleryApi = {
  addImage: (shopId, data) => api.post(`/gallery/${shopId}`, data),
  getGallery: (shopId) => api.get(`/gallery/${shopId}`),
  updateImage: (shopId, imageId, data) => api.put(`/gallery/${shopId}/${imageId}`, data),
  deleteImage: (shopId, imageId) => api.delete(`/gallery/${shopId}/${imageId}`),
};

// Review API
export const reviewApi = {
  getShopReviews: (shopId, params) => api.get(`/reviews/shop/${shopId}?${new URLSearchParams(params)}`),
  replyToReview: (reviewId, shopId, reply) => api.put(`/reviews/${reviewId}/reply/${shopId}`, { reply }),
};
