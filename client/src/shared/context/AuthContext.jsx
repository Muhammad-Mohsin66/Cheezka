import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

const STAFF_ROLES = ['admin', 'employee', 'rider'];

export const AuthProvider = ({ children }) => {
  // Storefront customer session states
  const [customerUser, setCustomerUser] = useState(null);
  const [customerToken, setCustomerToken] = useState(localStorage.getItem('authToken') || null);
  const [customerIsAuthenticated, setCustomerIsAuthenticated] = useState(false);

  // Staff (admin/employee/rider) session states
  const [staffUser, setStaffUser] = useState(null);
  const [staffToken, setStaffToken] = useState(localStorage.getItem('staffAuthToken') || null);
  const [staffIsAuthenticated, setStaffIsAuthenticated] = useState(false);

  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Initialize auth on mount
  useEffect(() => {
    const loadUsers = async () => {
      const savedCustomerToken = localStorage.getItem('authToken');
      const savedStaffToken = localStorage.getItem('staffAuthToken');

      let customerLoaded = false;
      let staffLoaded = false;

      // 1. Load customer
      if (savedCustomerToken) {
        try {
          // Explicitly pass Authorization header to bypass request interceptor location checks
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${savedCustomerToken}` }
          });
          const userData = response.data.user || response.data.data || null;
          if (userData) {
            setCustomerUser(userData);
            setCustomerToken(savedCustomerToken);
            setCustomerIsAuthenticated(true);
            localStorage.setItem('cheezka_user', JSON.stringify(userData));
            customerLoaded = true;
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('cheezka_user');
          setCustomerToken(null);
          setCustomerUser(null);
          setCustomerIsAuthenticated(false);
        }
      }

      // 2. Load staff
      if (savedStaffToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${savedStaffToken}` }
          });
          const userData = response.data.user || response.data.data || null;
          if (userData) {
            setStaffUser(userData);
            setStaffToken(savedStaffToken);
            setStaffIsAuthenticated(true);
            localStorage.setItem('staffUser', JSON.stringify(userData));
            staffLoaded = true;
          }
        } catch (error) {
          localStorage.removeItem('staffAuthToken');
          localStorage.removeItem('staffUser');
          setStaffToken(null);
          setStaffUser(null);
          setStaffIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    loadUsers();
  }, []);

  const login = (userData, tokenVal) => {
    const isStaff = STAFF_ROLES.includes(userData?.role);
    if (isStaff) {
      localStorage.setItem('staffAuthToken', tokenVal);
      localStorage.setItem('staffUser', JSON.stringify(userData));
      setStaffToken(tokenVal);
      setStaffUser(userData);
      setStaffIsAuthenticated(true);
    } else {
      localStorage.setItem('authToken', tokenVal);
      localStorage.setItem('cheezka_user', JSON.stringify(userData));
      setCustomerToken(tokenVal);
      setCustomerUser(userData);
      setCustomerIsAuthenticated(true);
    }
  };

  const logout = () => {
    const isStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname.startsWith('/rider');
    if (isStaffRoute) {
      localStorage.removeItem('staffAuthToken');
      localStorage.removeItem('staffUser');
      setStaffToken(null);
      setStaffUser(null);
      setStaffIsAuthenticated(false);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('cheezka_user');
      setCustomerToken(null);
      setCustomerUser(null);
      setCustomerIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    const isStaff = STAFF_ROLES.includes(updatedUserData?.role);
    if (isStaff) {
      setStaffUser(updatedUserData);
      localStorage.setItem('staffUser', JSON.stringify(updatedUserData));
    } else {
      setCustomerUser(updatedUserData);
      localStorage.setItem('cheezka_user', JSON.stringify(updatedUserData));
    }
  };

  // Determine active context based on routing
  const isStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname.startsWith('/rider');

  const user = isStaffRoute ? staffUser : customerUser;
  const token = isStaffRoute ? staffToken : customerToken;
  const isAuthenticated = isStaffRoute ? staffIsAuthenticated : customerIsAuthenticated;

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
