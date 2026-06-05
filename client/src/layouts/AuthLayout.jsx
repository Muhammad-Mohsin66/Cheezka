import React from 'react';

/**
 * AuthLayout Component
 * Centered layout for login and register pages
 */
const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🍔</div>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Form Container */}
        <div style={styles.formContainer}>
          {children}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>© 2026 Cheezka Food Service. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
  },
  content: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  logo: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  title: {
    margin: '0',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.95rem',
    color: '#7f8c8d',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  footer: {
    textAlign: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #ecf0f1',
    color: '#7f8c8d',
    fontSize: '0.85rem',
  },
};

export default AuthLayout;
