import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if it exists
api.interceptors.request.use(
  (config) => {
    // If config has an explicit Authorization header, do not overwrite it!
    if (config.headers.Authorization) {
      return config;
    }
    const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
    const token = localStorage.getItem(isStaff ? 'staffAuthToken' : 'authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
      localStorage.removeItem(isStaff ? 'staffAuthToken' : 'authToken');
      localStorage.removeItem(isStaff ? 'staffUser' : 'cheezka_user');
      window.location.href = isStaff ? '/admin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
