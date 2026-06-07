import './index.css';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import { AdminRoutes, EmployeeRoutes, RiderRoutes } from './admin/routes';
import StorefrontRoutes from './storefront/routes';
import Unauthorized from './shared/components/Unauthorized';

/**
 * App — Root router with fully isolated modules:
 *  • /admin/*    → Admin panel (admin role)
 *  • /employee/* → Employee panel
 *  • /rider/*    → Rider panel
 *  • /*          → Storefront (customer-facing)
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/employee/*" element={<EmployeeRoutes />} />
        <Route path="/rider/*" element={<RiderRoutes />} />

        <Route path="/*" element={<StorefrontRoutes />} />
      </Routes>
    </AuthProvider>
  );
}
