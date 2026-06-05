import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('authToken');

      if (savedToken) {
        try {
          setToken(savedToken);
          // Verify token is still valid — backend returns { success, user }
          const response = await api.get('/auth/me');
          const userData = response.data.user || response.data.data || null;
          setUser(userData);
          setIsAuthenticated(true);
          // Keep cheezka_user in sync for hooks.js navbar
          if (userData) {
            localStorage.setItem('cheezka_user', JSON.stringify(userData));
          }
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('cheezka_user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('cheezka_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('cheezka_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('cheezka_user', JSON.stringify(updatedUserData));
  };

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
