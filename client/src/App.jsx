import './index.css';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import StorefrontRoutes from './modules/storefront/routes';
import AdminRoutes from './modules/admin/routes';
import Unauthorized from './components/Unauthorized';

/**
 * App — Root router.
 *
 * Delegates routing to two completely independent modules:
 *  • /admin/*    → AdminRoutes   (RBAC-protected, staff only)
 *  • /employee/* → AdminRoutes   (RBAC-protected, employee/admin)
 *  • /rider/*    → AdminRoutes   (RBAC-protected, rider/admin)
 *  • /*          → StorefrontRoutes (public + customer-authenticated)
 *
 * The AuthProvider wraps the entire tree so that both modules can
 * share the same auth context (user, token, login, logout).
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Dedicated 403 page — accessible from anywhere */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin / Employee / Rider panel (internal operations) */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/employee/*" element={<AdminRoutes />} />
        <Route path="/rider/*" element={<AdminRoutes />} />

        {/* Customer storefront (public + authenticated shoppers) */}
        <Route path="/*" element={<StorefrontRoutes />} />
      </Routes>
    </AuthProvider>
  );
}
