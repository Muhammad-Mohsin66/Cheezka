import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import {
  CHECKOUT_AUTH_MESSAGE,
  DEFAULT_CHECKOUT_RETURN,
  saveCheckoutReturnPath,
} from '../utils/checkoutAuth';

/**
 * Redirects unauthenticated users to login before checkout.
 * Authenticated customers proceed to the checkout drawer on the shop page.
 */
export default function CheckoutAuthRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && user?.role === 'customer') {
      navigate(DEFAULT_CHECKOUT_RETURN, { replace: true });
      return;
    }

    if (isAuthenticated && user?.role !== 'customer') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    saveCheckoutReturnPath(DEFAULT_CHECKOUT_RETURN);
    navigate('/login?from=checkout', {
      replace: true,
      state: { message: CHECKOUT_AUTH_MESSAGE },
    });
  }, [isAuthenticated, user, loading, navigate]);

  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <p>Redirecting…</p>
    </div>
  );
}
