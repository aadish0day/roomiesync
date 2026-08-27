import axios from 'axios';

const API_BASE_URL = '/api';

// Create central Axios instance pointing to Express MongoDB Backend
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized API Service interfacing with live Express/MongoDB backend
export const apiService = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name, email, password, role) => {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  // Users & Profiles
  getProfile: async (userId) => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/profile/${userId}`, profileData);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  toggleVerifyUser: async (userId, isVerified) => {
    const response = await api.put(`/users/${userId}/verify`, { isVerified });
    return response.data;
  },

  removeUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Properties
  getProperties: async (filters = {}) => {
    const response = await api.get('/properties');
    let props = response.data;
    if (filters.location) {
      props = props.filter(p => p.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.maxBudget) {
      props = props.filter(p => p.price <= Number(filters.maxBudget));
    }
    if (filters.type && filters.type !== 'All') {
      props = props.filter(p => p.type === filters.type);
    }
    return props;
  },

  getOwnerProperties: async (ownerId) => {
    const response = await api.get(`/properties/owner/${ownerId}`);
    return response.data;
  },

  getBookingsForOwner: async (ownerId) => {
    const response = await api.get(`/bookings/owner/${ownerId}`);
    return response.data;
  },

  addProperty: async (propertyData) => {
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  bookProperty: async (propertyId, userId, date) => {
    const response = await api.post('/properties/book', { propertyId, userId, date });
    return response.data;
  },

  // Meal Plans
  getMealPlans: async () => {
    const response = await api.get('/meals/plans');
    return response.data;
  },

  subscribeMeal: async (planId, userId, duration) => {
    const response = await api.post('/meals/subscribe', { planId, userId, duration });
    return response.data;
  },

  getSubscriptions: async (userId) => {
    const response = await api.get(`/meals/subscriptions/${userId}`);
    return response.data;
  },

  // Expense Tracker
  getExpenses: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },

  addExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Agreements
  getAgreements: async (userId) => {
    const response = await api.get(`/agreements/${userId}`);
    return response.data;
  },

  addAgreement: async (agreementData) => {
    const response = await api.post('/agreements', agreementData);
    return response.data;
  },

  // Reviews & Reports
  getReviews: async () => {
    const response = await api.get('/reviews');
    return response.data;
  },

  addReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/reports');
    return response.data;
  },

  reportFakeUser: async (targetUserId, reportedBy, reason) => {
    const response = await api.post('/reports', { targetUserId, reportedBy, reason });
    return response.data;
  },

  resolveReport: async (reportId, status) => {
    const response = await api.put(`/reports/${reportId}`, { status });
    return response.data;
  },

  // Notifications
  getNotifications: async (userId) => {
    const response = await api.get(`/notifications/${userId}`);
    return response.data;
  },

  // Admin Dashboard
  getAdminStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }
};


