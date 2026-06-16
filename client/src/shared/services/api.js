import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add headers to determine session type
api.interceptors.request.use(
  (config) => {
    const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
    config.headers['X-Session-Type'] = isStaff ? 'staff' : 'customer';
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isAuthCheck && !isLoginPage) {
        const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
        localStorage.removeItem(isStaff ? 'staffUser' : 'cheezka_user');
        window.location.href = isStaff ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
