import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Public Pages
import Home from '../pages/Home';
import Menu from '../pages/Menu';
import Order from '../pages/Order';
import Checkout from '../pages/Checkout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import NotificationsPage from '../pages/NotificationsPage';

// Order Management Pages
import CustomerOrders from '../pages/CustomerOrders';
import OrdersManagement from '../pages/OrdersManagement';
import RiderDeliveries from '../pages/RiderDeliveries';

/**
 * Role-Based Route Wrapper
 * Wraps pages in appropriate layout based on context
 */
const PublicPage = ({ children }) => (
  <MainLayout>{children}</MainLayout>
);

const AdminPage = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const EmployeePage = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const RiderPage = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const CustomerPage = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

/**
 * App Routes Component
 * Defines all routes with role-based access control
 */
const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ============ PUBLIC ROUTES ============ */}
          <Route path="/" element={<PublicPage><Home /></PublicPage>} />
          <Route path="/menu" element={<PublicPage><Menu /></PublicPage>} />
          <Route path="/product/:id" element={<PublicPage><Dashboard /></PublicPage>} />
          <Route path="/cart" element={<PublicPage><Order /></PublicPage>} />
          <Route path="/checkout" element={<PublicPage><Checkout /></PublicPage>} />

          {/* ============ AUTH ROUTES ============ */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ============ NOTIFICATIONS ROUTE ============ */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout><NotificationsPage /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* ============ CUSTOMER ROUTES ============ */}
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerPage><CustomerOrders /></CustomerPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerPage><Dashboard /></CustomerPage>
              </ProtectedRoute>
            }
          />

          {/* ============ EMPLOYEE ROUTES ============ */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeePage><Dashboard /></EmployeePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/orders"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeePage><OrdersManagement /></EmployeePage>
              </ProtectedRoute>
            }
          />

          {/* ============ RIDER ROUTES ============ */}
          <Route
            path="/rider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <RiderPage><Dashboard /></RiderPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider/deliveries"
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <RiderPage><RiderDeliveries /></RiderPage>
              </ProtectedRoute>
            }
          />

          {/* ============ ADMIN ROUTES ============ */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><AdminDashboard /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><Dashboard /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><Dashboard /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><OrdersManagement /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><Dashboard /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><Dashboard /></AdminPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage><Dashboard /></AdminPage>
              </ProtectedRoute>
            }
          />

          {/* ============ 404 FALLBACK ============ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;
