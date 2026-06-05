import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardLayout Component
 * Layout with sidebar for admin, employee, and rider dashboards
 */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Menu items based on user role
  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
          { label: 'Products', path: '/admin/products', icon: '📦' },
          { label: 'Categories', path: '/admin/categories', icon: '🏷️' },
          { label: 'Orders', path: '/admin/orders', icon: '📋' },
          { label: 'Payments', path: '/admin/payments', icon: '💳' },
          { label: 'Refunds', path: '/admin/refunds', icon: '↩️' },
          { label: 'Reports', path: '/admin/reports', icon: '📈' },
        ];
      case 'employee':
        return [
          { label: 'Dashboard', path: '/employee/dashboard', icon: '📊' },
          { label: 'Orders', path: '/employee/orders', icon: '📋' },
        ];
      case 'rider':
        return [
          { label: 'Dashboard', path: '/rider/dashboard', icon: '📊' },
          { label: 'Deliveries', path: '/rider/deliveries', icon: '🚴' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '250px' : '70px' }}>
        {/* Logo/Brand */}
        <div style={styles.logo}>
          <span style={styles.logoText}>🍔</span>
          {sidebarOpen && <span>Cheezka</span>}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={styles.toggleBtn}
        >
          {sidebarOpen ? '←' : '→'}
        </button>

        {/* Navigation */}
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) && styles.navItemActive),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>{user?.email?.[0].toUpperCase()}</div>
          {sidebarOpen && (
            <div style={styles.userDetails}>
              <p style={styles.userName}>{user?.email}</p>
              <p style={styles.userRole}>{user?.role}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            ...styles.logoutBtn,
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
        >
          <span>🚪</span>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <h1>Dashboard</h1>
          <div style={styles.headerRight}>
            <p>Welcome, {user?.email}</p>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    padding: '1rem',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    cursor: 'pointer',
  },
  logoText: {
    fontSize: '2rem',
  },
  toggleBtn: {
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
    transition: 'background-color 0.2s',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#ecf0f1',
    textDecoration: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    backgroundColor: '#3498db',
    fontWeight: 'bold',
  },
  icon: {
    fontSize: '1.2rem',
    minWidth: '1.5rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#34495e',
    borderRadius: '4px',
    marginTop: '1rem',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3498db',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  userDetails: {
    minWidth: 0,
  },
  userName: {
    margin: '0',
    fontSize: '0.85rem',
    wordBreak: 'break-word',
  },
  userRole: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.75rem',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: '#ecf0f1',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    transition: 'margin-left 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  content: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
  },
};

export default DashboardLayout;
