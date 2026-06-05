import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomePage from '../../pages/HomePage';
import ShopPage from '../../pages/ShopPage';
import AboutPage from '../../pages/AboutPage';
import ContactPage from '../../pages/ContactPage';
import PagesPage from '../../pages/PagesPage';
import LoginPage from '../../pages/LoginPage';
import SignupPage from '../../pages/SignupPage';
import DashboardPage from '../../pages/DashboardPage';
import OrdersPage from '../../pages/OrdersPage';
import {
  useBodyClass,
  useGlobalStyles,
  useHamburgerToggle,
  useLegacyLinkInterceptor,
  useNavLabelNormalization,
  useNavbarProfile,
  usePreventRefreshMonitor,
  useScrollTopButton,
} from '../../hooks';

function RouteFrame({ bodyClass, title, disableNavEnhancements = false, children }) {
  useGlobalStyles();
  useBodyClass(bodyClass);
  useLegacyLinkInterceptor();
  useHamburgerToggle();
  useNavLabelNormalization(!disableNavEnhancements);
  useNavbarProfile(!disableNavEnhancements);
  useScrollTopButton();
  usePreventRefreshMonitor();

  const location = useLocation();

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <div key={location.pathname}>{children}</div>;
}

/**
 * StorefrontRoutes — Customer-facing routes only.
 * No admin/employee/rider pages here.
 */
export default function StorefrontRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <RouteFrame
            bodyClass="home wp-singular page-template page-template-templates page-template-page-full page-template-templatespage-full-php page page-id-2493 wp-embed-responsive wp-theme-cheezka theme-cheezka woocommerce-no-js lines singular enable-search-modal missing-post-thumbnail has-no-pagination not-showing-comments show-avatars page-full footer-top-visible elementor-default elementor-kit-10 elementor-page elementor-page-2493"
            title="cheezka - Street Food"
          >
            <HomePage />
          </RouteFrame>
        }
      />
      <Route
        path="/shop"
        element={
          <RouteFrame bodyClass="page lines" title="Shop / Menu – Cheezka Street Food">
            <ShopPage />
          </RouteFrame>
        }
      />
      <Route
        path="/about"
        element={
          <RouteFrame bodyClass="page lines" title="About Us – Cheezka Street Food">
            <AboutPage />
          </RouteFrame>
        }
      />
      <Route
        path="/contact"
        element={
          <RouteFrame bodyClass="page lines" title="Contact Us – Cheezka Street Food">
            <ContactPage />
          </RouteFrame>
        }
      />
      <Route
        path="/pages"
        element={
          <RouteFrame bodyClass="page lines" title="Special Deals – Cheezka Street Food">
            <PagesPage />
          </RouteFrame>
        }
      />

      {/* Auth Pages */}
      <Route
        path="/login"
        element={
          <RouteFrame bodyClass="auth-page" title="Login – Cheezka Street Food">
            <LoginPage />
          </RouteFrame>
        }
      />
      <Route
        path="/signup"
        element={
          <RouteFrame bodyClass="auth-page" title="Sign Up – Cheezka Street Food">
            <SignupPage />
          </RouteFrame>
        }
      />

      {/* Authenticated Customer Pages */}
      <Route
        path="/dashboard"
        element={
          <RouteFrame bodyClass="page lines" title="Dashboard – Cheezka Street Food">
            <DashboardPage />
          </RouteFrame>
        }
      />
      <Route
        path="/orders"
        element={
          <RouteFrame bodyClass="page lines" title="My Orders – Cheezka Street Food">
            <OrdersPage />
          </RouteFrame>
        }
      />

      {/* Legacy HTML Redirects */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/index_clean.html" element={<Navigate to="/" replace />} />
      <Route path="/shop.html" element={<Navigate to="/shop" replace />} />
      <Route path="/about.html" element={<Navigate to="/about" replace />} />
      <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
      <Route path="/pages.html" element={<Navigate to="/pages" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
      <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />
      <Route path="/orders.html" element={<Navigate to="/orders" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
