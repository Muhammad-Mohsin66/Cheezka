import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getNavSectionsForRole } from '../constants/navigation';
import api from '../../shared/services/api';

/* ─── CSS injected once ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  :root {
    --sidebar-bg: #0f1117;
    --sidebar-border: rgba(255,255,255,0.06);
    --sidebar-hover: rgba(255,107,53,0.1);
    --sidebar-active: rgba(255,107,53,0.18);
    --brand: #FF6B35;
    --brand-dim: rgba(255,107,53,0.7);
    --text-primary: #f1f1f1;
    --text-muted: #8b8fa8;
    --section-label: #5a5e72;
    --content-bg: #f6f6f4;
    --nav-bar-bg: #ffffff;
    --shadow-sm: 0 1px 4px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
    --radius: 10px;
    --transition: all 0.25s ease;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', sans-serif; }

  .ck-admin-root { display: flex; min-height: 100vh; background: var(--content-bg); }

  /* ── Sidebar ── */
  .ck-sidebar {
    background: var(--sidebar-bg);
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
    z-index: 200;
    border-right: 1px solid var(--sidebar-border);
  }
  .ck-sidebar.open  { width: 240px; }
  .ck-sidebar.closed { width: 64px; }

  .ck-sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 16px 16px;
    border-bottom: 1px solid var(--sidebar-border);
    flex-shrink: 0;
    min-height: 64px;
  }
  .ck-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--brand);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .ck-logo-text { font-size: 15px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
  .ck-logo-sub  { font-size: 10px; color: var(--text-muted); font-weight: 400; }

  /* Toggle button */
  .ck-toggle {
    position: absolute; top: 18px; right: -12px;
    width: 24px; height: 24px;
    background: var(--brand); border: none;
    border-radius: 50%; color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
    z-index: 201;
  }
  .ck-toggle:hover { transform: scale(1.1); }

  /* Nav scroll area */
  .ck-nav-scroll {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 12px 8px;
    scrollbar-width: thin; scrollbar-color: #2a2d3a transparent;
  }
  .ck-nav-scroll::-webkit-scrollbar { width: 4px; }
  .ck-nav-scroll::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 4px; }

  /* Section labels */
  .ck-section-label {
    font-size: 9px; font-weight: 700; letter-spacing: 1.2px;
    color: var(--section-label); text-transform: uppercase;
    padding: 10px 10px 4px;
    white-space: nowrap; overflow: hidden;
    transition: opacity 0.2s;
  }
  .ck-sidebar.closed .ck-section-label { opacity: 0; pointer-events: none; height: 0; padding: 0; }

  .ck-section-divider { height: 1px; background: var(--sidebar-border); margin: 8px 4px; }
  .ck-sidebar.closed .ck-section-divider { margin: 4px; }

  /* Nav item */
  .ck-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 8px;
    color: var(--text-muted);
    text-decoration: none; cursor: pointer;
    transition: var(--transition);
    white-space: nowrap; font-size: 13px; font-weight: 500;
    position: relative; margin: 1px 0;
  }
  .ck-nav-item:hover { background: var(--sidebar-hover); color: var(--text-primary); }
  .ck-nav-item.active {
    background: var(--sidebar-active);
    color: var(--brand);
    font-weight: 600;
  }
  .ck-nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; border-radius: 0 3px 3px 0;
    background: var(--brand);
  }
  .ck-nav-icon { font-size: 16px; min-width: 20px; text-align: center; flex-shrink: 0; }
  .ck-nav-label { overflow: hidden; flex: 1; }
  .ck-sidebar.closed .ck-nav-label { display: none; }
  .ck-sidebar.closed .ck-nav-item { justify-content: center; padding: 9px; }

  /* Badge */
  .ck-badge {
    background: var(--brand); color: white;
    border-radius: 10px; font-size: 9px; font-weight: 700;
    padding: 1px 5px; min-width: 16px; text-align: center;
    flex-shrink: 0;
  }
  .ck-sidebar.closed .ck-badge { display: none; }

  /* User card */
  .ck-user-card {
    padding: 12px; border-top: 1px solid var(--sidebar-border);
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0;
  }
  .ck-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--brand), #ff9068);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .ck-user-info { overflow: hidden; flex: 1; min-width: 0; }
  .ck-user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ck-user-role { font-size: 10px; color: var(--text-muted); text-transform: capitalize; }
  .ck-sidebar.closed .ck-user-info { display: none; }

  /* Logout */
  .ck-logout-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; margin: 4px 8px 8px;
    background: rgba(231,76,60,0.08);
    border: 1px solid rgba(231,76,60,0.15);
    border-radius: 8px; color: #e74c3c;
    cursor: pointer; font-size: 13px; font-weight: 500;
    transition: var(--transition); white-space: nowrap;
  }
  .ck-logout-btn:hover { background: rgba(231,76,60,0.18); }
  .ck-sidebar.closed .ck-logout-btn { justify-content: center; }
  .ck-sidebar.closed .ck-logout-label { display: none; }

  /* ── Main content ── */
  .ck-main {
    flex: 1;
    display: flex; flex-direction: column;
    transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
  }
  .ck-main.open   { margin-left: 240px; }
  .ck-main.closed { margin-left: 64px; }

  /* Top navbar */
  .ck-topbar {
    background: var(--nav-bar-bg);
    border-bottom: 1px solid #ebebeb;
    height: 64px; display: flex; align-items: center;
    padding: 0 24px; gap: 16px;
    box-shadow: var(--shadow-sm);
    position: sticky; top: 0; z-index: 100;
  }
  .ck-topbar-title { font-size: 17px; font-weight: 700; color: #1a1a1a; flex: 1; }
  .ck-topbar-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: var(--transition);
  }
  .ck-topbar-badge.alert { background: #fff3e0; color: #e65100; }
  .ck-topbar-badge.alert:hover { background: #ffe0b2; }
  .ck-topbar-user {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: #555;
  }
  .ck-topbar-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, var(--brand), #ff9068);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
  }

  /* Page content */
  .ck-page-content { flex: 1; padding: 28px; overflow-y: auto; }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .ck-page-content > * { animation: fadeIn 0.25s ease; }
`;

if (typeof document !== 'undefined' && !document.getElementById('ck-admin-styles')) {
  const style = document.createElement('style');
  style.id = 'ck-admin-styles';
  style.innerHTML = STYLES;
  document.head.appendChild(style);
}

/* ─── DashboardLayout ────────────────────────────────────────────────────────── */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [badges, setBadges] = useState({ orders: 0, stock: 0, notifications: 0 });
  const { user, logout } = useAuth();
  const location = useLocation();

  const sections = getNavSectionsForRole(user?.role);

  // Compute page title from current path
  const currentPath = location.pathname;
  const allItems = sections.flatMap((s) => s.items);
  const currentItem = allItems.find((i) => i.path === currentPath);
  const pageTitle = currentItem?.label || 'Admin Panel';

  // Poll for badge counts every 60 s
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [orderRes, stockRes, notifRes] = await Promise.allSettled([
          api.get('/orders/admin/all'),
          api.get('/inventory/alerts'),
          api.get('/notifications?unread=true'),
        ]);

        setBadges({
          orders:
            orderRes.status === 'fulfilled'
              ? (orderRes.value.data?.data || []).filter(
                  (o) => o.orderStatus === 'Pending'
                ).length
              : 0,
          stock:
            stockRes.status === 'fulfilled'
              ? stockRes.value.data?.count || 0
              : 0,
          notifications:
            notifRes.status === 'fulfilled'
              ? notifRes.value.data?.count || 0
              : 0,
        });
      } catch {
        // Silently ignore
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const getBadgeValue = (badgeKey) => {
    if (!badgeKey) return 0;
    return badges[badgeKey] || 0;
  };

  return (
    <div className="ck-admin-root">
      {/* Sidebar */}
      <aside className={`ck-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="ck-sidebar-logo">
          <div className="ck-logo-icon">🍔</div>
          {sidebarOpen && (
            <div>
              <div className="ck-logo-text">Cheezka</div>
              <div className="ck-logo-sub">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          className="ck-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          type="button"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* Navigation */}
        <div className="ck-nav-scroll">
          {sections.map((section, si) => (
            <div key={si}>
              {si > 0 && <div className="ck-section-divider" />}
              {section.section && (
                <div className="ck-section-label">{section.section}</div>
              )}
              {section.items.map((item) => {
                const badgeVal = getBadgeValue(item.badge);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`ck-nav-item ${currentPath === item.path ? 'active' : ''}`}
                  >
                    <span className="ck-nav-icon">{item.icon}</span>
                    <span className="ck-nav-label">{item.label}</span>
                    {badgeVal > 0 && (
                      <span className="ck-badge">{badgeVal > 99 ? '99+' : badgeVal}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="ck-user-card">
          <div className="ck-avatar">{user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}</div>
          {sidebarOpen && (
            <div className="ck-user-info">
              <div className="ck-user-name">{user?.name || user?.email}</div>
              <div className="ck-user-role">{user?.role}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          type="button"
          className="ck-logout-btn"
        >
          <span>🚪</span>
          <span className="ck-logout-label">Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className={`ck-main ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Top bar */}
        <header className="ck-topbar">
          <span className="ck-topbar-title">{pageTitle}</span>

          {badges.stock > 0 && (
            <Link to="/admin/stock-alerts" className="ck-topbar-badge alert">
              ⚠️ {badges.stock} Low Stock
            </Link>
          )}

          <div className="ck-topbar-user">
            <span style={{ fontSize: 12, color: '#999' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div className="ck-topbar-avatar">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="ck-page-content">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
