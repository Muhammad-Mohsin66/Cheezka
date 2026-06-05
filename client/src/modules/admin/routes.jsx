import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import Unauthorized from '../../components/Unauthorized';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminDashboard from '../../pages/AdminDashboard';
import OrdersManagement from '../../pages/OrdersManagement';
import RiderDeliveries from '../../pages/RiderDeliveries';
import Dashboard from '../../pages/Dashboard';

/**
 * AdminRoutes — All internal staff/admin pages.
 * Protected by role (admin / employee / rider).
 * Completely separate from the customer-facing storefront.
 *
 * NOTE: App.jsx mounts this at /admin/*, /employee/*, /rider/*
 * so the Routes defined here match the FULL path (absolute).
 */
export default function AdminRoutes() {
  return (
    <Routes>
      {/* ── Admin-only routes ─────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={['admin', 'employee']}>
            <DashboardLayout>
              <OrdersManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <PlaceholderPage title="Products Management" icon="📦" description="Manage your product catalog, pricing, and availability." />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <PlaceholderPage title="Category Management" icon="🏷️" description="Organize products into categories." />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <PlaceholderPage title="Payment Records" icon="💳" description="View and manage all customer payment transactions." />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/refunds"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <PlaceholderPage title="Refund Management" icon="↩️" description="Process and track refund requests." />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <PlaceholderPage title="Reports & Analytics" icon="📈" description="View detailed business analytics and performance reports." />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Employee routes ───────────────────────────────────── */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/orders"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <DashboardLayout>
              <OrdersManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Rider routes ──────────────────────────────────────── */}
      <Route
        path="/rider/dashboard"
        element={
          <ProtectedRoute allowedRoles={['rider', 'admin']}>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/deliveries"
        element={
          <ProtectedRoute allowedRoles={['rider', 'admin']}>
            <DashboardLayout>
              <RiderDeliveries />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Unauthorized + Fallback ───────────────────────────── */}
      <Route path="*" element={<Unauthorized />} />
    </Routes>
  );
}

/**
 * PlaceholderPage — Rendered for admin routes that don't have a dedicated page yet.
 */
function PlaceholderPage({ title, icon, description }) {
  return (
    <div style={{
      padding: '60px 24px',
      textAlign: 'center',
      color: '#1A1A1A',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>{title}</h1>
      <p style={{ fontSize: '15px', color: '#666', maxWidth: '400px', margin: '0 auto 32px' }}>{description}</p>
      <div style={{
        display: 'inline-block',
        padding: '12px 28px',
        backgroundColor: '#FF6B35',
        color: 'white',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        🚧 Coming Soon
      </div>
    </div>
  );
}
