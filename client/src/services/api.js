import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getPending: () => api.get('/orders/pending/optimization'),
  bulkUpdateStatus: (orderIds, status) => api.patch('/orders/bulk-status', { orderIds, status }),
};

// Staff API
export const staffAPI = {
  getAll: (params = {}) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  getAvailable: () => api.get('/staff/available/optimization'),
  updateLocation: (id, lat, lng) => api.patch(`/staff/${id}/location`, { lat, lng }),
  getRoute: (id) => api.get(`/staff/${id}/route`),
  updateRoute: (id, route) => api.patch(`/staff/${id}/route`, { route }),
  updateAvailability: (id, available) => api.patch(`/staff/${id}/availability`, { available }),
};

// Assignment API
export const assignAPI = {
  assignOrders: () => api.post('/assign'),
};

// Delivery API
export const deliveryAPI = {
  deliverOrder: (orderId, staffId) => api.post('/deliver', { orderId, staffId }),
  pickOrder: (orderId, staffId) => api.post('/pick', { orderId, staffId }),
};

// Route API
export const routeAPI = {
  getRoute: (staffId) => api.get(`/route/${staffId}`),
};

// Warehouse API
export const warehouseAPI = {
  get: () => api.get('/warehouse'),
  create: (data) => api.post('/warehouse', data),
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api; 