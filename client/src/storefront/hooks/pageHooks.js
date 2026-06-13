import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { checkHealth, createOrder, listOrders, updateOrderStatus } from '../utils/api';
import {
  getCart,
  setCart as persistCart,
  clearCart,
  preserveGuestCartThroughAuth,
} from '../utils/cart';
import {
  CHECKOUT_AUTH_MESSAGE,
  getPostAuthRedirectPath,
  isCheckoutAuthFlow,
  saveCheckoutReturnPath,
} from '../utils/checkoutAuth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getLocalJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function setLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
export function useLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

  const fromCheckout = isCheckoutAuthFlow(searchParams);
  const checkoutNotice = fromCheckout ? CHECKOUT_AUTH_MESSAGE : '';

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostAuthRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (localStorage.getItem('cheezka_user')) return;
    const saved = getLocalJson('cheezka_login_form', {});
    setEmail(saved.email || '');
    setRememberMe(Boolean(saved.rememberMe));
  }, []);

  useEffect(() => {
    setLocalJson('cheezka_login_form', { email, rememberMe });
  }, [email, rememberMe]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setStatus({ message: 'Please fill in all fields', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password.length < 6) {
      setStatus({ message: 'Password must be at least 6 characters', bg: '#ffcdd2', color: '#c62828' });
      return;
    }

    setStatus({ message: 'Logging in…', bg: '#e3f2fd', color: '#0C4C7B' });

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || 'Login failed', bg: '#ffcdd2', color: '#c62828' });
        return;
      }

      const guestCart = preserveGuestCartThroughAuth();
      authLogin({ ...data.user, rememberMe }, data.token);
      localStorage.removeItem('cheezka_login_form');
      if (guestCart.length) {
        persistCart(guestCart);
      }

      const redirectTo = getPostAuthRedirectPath(data.user);
      setStatus({ message: 'Login successful! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate(redirectTo), 800);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    status,
    onSubmit,
    checkoutNotice,
    fromCheckout,
  };
}

// ─────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────
export function useSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

  const fromCheckout = isCheckoutAuthFlow(searchParams);
  const checkoutNotice = fromCheckout ? CHECKOUT_AUTH_MESSAGE : '';
  const loginHref = fromCheckout ? '/login?from=checkout' : '/login';

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostAuthRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setStatus({ message: 'Please fill in all fields', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ message: 'Please enter a valid email address', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password.length < 8) {
      setStatus({ message: 'Password must be at least 8 characters', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ message: 'Passwords do not match', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (!termsAgreed) {
      setStatus({ message: 'You must agree to the terms and conditions', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    const phoneVal = phone.trim();
    if (!phoneVal || !/^\d{11}$/.test(phoneVal)) {
      setStatus({ message: 'Please enter a valid 11-digit phone number', bg: '#ffcdd2', color: '#c62828' });
      return;
    }

    setStatus({ message: 'Creating account…', bg: '#e3f2fd', color: '#0C4C7B' });

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phoneVal, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || 'Registration failed', bg: '#ffcdd2', color: '#c62828' });
        return;
      }

      const guestCart = preserveGuestCartThroughAuth();
      authLogin(data.user, data.token);
      if (guestCart.length) {
        persistCart(guestCart);
      }

      const redirectTo = getPostAuthRedirectPath(data.user);
      setStatus({ message: 'Account created! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate(redirectTo), 800);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAgreed,
    setTermsAgreed,
    status,
    onSubmit,
    checkoutNotice,
    fromCheckout,
    loginHref,
  };
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export function useDashboardPage() {
  const navigate = useNavigate();
  const { user, logout: authLogout, isAuthenticated, loading } = useAuth();
  const [apiStatus, setApiStatus] = useState({ message: '', error: false, visible: false });

  useEffect(() => {
    if (loading) return undefined;
    if (!isAuthenticated || !user) {
      const t = setTimeout(() => navigate('/login'), 1200);
      return () => clearTimeout(t);
    }

    (async () => {
      try {
        await checkHealth();
        setApiStatus({ message: 'Connected to backend API.', error: false, visible: true });
      } catch {
        setApiStatus({
          message: 'Could not connect to backend. Make sure the server is running.',
          error: true,
          visible: true,
        });
      }
    })();
    return undefined;
  }, [isAuthenticated, user, loading, navigate]);

  const logout = () => {
    authLogout();
    navigate('/login');
  };

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.name || user.email?.split('@')[0] || '';
  }, [user]);

  return { user, displayName, apiStatus, logout };
}

// ─────────────────────────────────────────────
// Orders page
// ─────────────────────────────────────────────
export function useOrdersPage() {
  const [status, setStatus] = useState({ message: '', error: false, visible: false });
  const [orders, setOrders] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('--');
  const [savingId, setSavingId] = useState('');

  const loadOrders = async (showErrorBox = true) => {
    try {
      const data = await listOrders();
      // Backend returns { success, count, data }
      const list = data?.data ?? data;
      
      const mapped = (Array.isArray(list) ? list : []).map(order => ({
        order_id: order._id,
        created_at: order.createdAt || order.created_at,
        status: order.orderStatus || order.status,
        customer_name: order.customer?.name || order.customer_name || 'Customer',
        customer_phone: order.phoneNumber || order.customer_phone || '',
        customer_address: order.shippingAddress || order.customer_address || '',
        payment_method: order.paymentMethod || order.payment_method || 'COD',
        notes: order.notes || '',
        items: (order.orderItems || order.items || []).map(item => ({
          name: item.name,
          size: item.size,
          qty: item.quantity || item.qty,
          price: item.price
        })),
        total: order.grandTotal || order.total || order.totalAmount || 0
      }));

      setOrders(mapped);
      setStatus({ message: 'Connected to backend. Showing latest online orders.', error: false, visible: true });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      if (showErrorBox) {
        setStatus({ message: 'Failed to load orders. Make sure backend is running.', error: true, visible: true });
        setOrders([]);
      }
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  const saveStatus = async (orderId, newStatus) => {
    setSavingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setStatus({ message: `Order status updated for ${orderId}`, error: false, visible: true });
      await loadOrders(false);
    } catch (err) {
      setStatus({ message: err.message || 'Status update failed', error: true, visible: true });
    } finally {
      setSavingId('');
    }
  };

  return { status, orders, lastUpdated, savingId, refresh: () => loadOrders(true), saveStatus };
}

// ─────────────────────────────────────────────
// Shop / Cart
// ─────────────────────────────────────────────
export function useShopPage(menuVersion = 0) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCartState] = useState(() => getCart());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });
  const [placing, setPlacing] = useState(false);

  const updateCart = (updater) => {
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistCart(next);
      return next;
    });
  };

  useEffect(() => {
    setCartState(getCart());
  }, [location.pathname, location.search]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('cart') === '1' || query.get('checkout') === '1') {
      setDrawerOpen(true);
      if (query.get('checkout') === '1') {
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');

    if (nameInput && !nameInput.value) {
      nameInput.value = user.name || '';
    }
    if (phoneInput && !phoneInput.value) {
      phoneInput.value = user.phone || '';
    }
  }, [isAuthenticated, user, drawerOpen]);

  useEffect(() => {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    const itemsEl = document.getElementById('cart-items');
    if (!countEl || !totalEl || !itemsEl) return;

    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
    countEl.textContent = `${totalCount}`;
    totalEl.textContent = `${totalAmount}`;

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="cart-empty">No items yet. Add your favorite menu items.</div>';
      return;
    }

    const esc = (text) =>
      String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    itemsEl.innerHTML = cart
      .map(
        (item, index) => `
      <div class="cart-item">
        <p class="cart-item-title">${esc(item.name)}</p>
        <div class="cart-item-size">${esc(item.size ? `Size: ${item.size}` : 'Single item')}</div>
        <div class="cart-row">
          <div class="qty-controls">
            <button class="qty-btn" data-action="minus" data-index="${index}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
          </div>
          <div class="cart-price">Rs. ${item.qty * item.price}</div>
        </div>
        <button class="remove-btn" data-action="remove" data-index="${index}">Remove</button>
      </div>
    `
      )
      .join('');

    itemsEl.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.getAttribute('data-index'));
        const action = btn.getAttribute('data-action');
        updateCart((prev) => {
          const next = [...prev];
          if (!next[index]) return prev;
          if (action === 'plus') next[index] = { ...next[index], qty: next[index].qty + 1 };
          if (action === 'minus') next[index] = { ...next[index], qty: next[index].qty - 1 };
          if (action === 'remove' || next[index].qty <= 0) next.splice(index, 1);
          return next;
        });
      });
    });
  }, [cart]);

  useEffect(() => {
    const parsePrice = (raw) => {
      const cleaned = String(raw || '').replace(/[^0-9]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 0;
    };

    const addToCart = (name, size, price) => {
      updateCart((prev) => {
        const found = prev.find((item) => item.name === name && item.size === size && item.price === price);
        if (found) {
          return prev.map((item) => (item === found ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { name, size, price, qty: 1 }];
      });
      setStatus({ message: `Added to cart: ${name}${size ? ` (${size})` : ''}`, error: false });
    };

    document.querySelectorAll('.menu-card').forEach((card) => {
      if (card.getAttribute('data-cart-enhanced') === '1') return;
      const itemName = card.querySelector('.menu-item-name')?.textContent?.trim();
      if (!itemName) return;

      const sizeBoxes = card.querySelectorAll('.size-box');

      // Helper to retrieve the current active size and price
      const getActiveSizeInfo = () => {
        if (sizeBoxes.length === 0) {
          const priceText = card.querySelector('.price-amount')?.textContent || '0';
          return { size: 'Regular', price: parsePrice(priceText) };
        }
        const activeBox = card.querySelector('.size-box.active');
        if (!activeBox) {
          // Fallback to first box if none active
          const firstBox = sizeBoxes[0];
          const size = firstBox?.querySelector('.size-label')?.textContent?.trim() || 'Regular';
          const price = parsePrice(firstBox?.querySelector('.size-price')?.textContent);
          return { size, price };
        }
        const size = activeBox.querySelector('.size-label')?.textContent?.trim() || 'Regular';
        const price = parsePrice(activeBox.querySelector('.size-price')?.textContent);
        return { size, price };
      };

      // Create Dynamic Price Display
      const priceDisplay = document.createElement('div');
      priceDisplay.className = 'card-price-display';

      // Create Action buttons container
      const actionsRow = document.createElement('div');
      actionsRow.className = 'card-actions-row';

      const addBtn = document.createElement('button');
      addBtn.className = 'card-add-btn';
      addBtn.type = 'button';
      addBtn.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';

      const buyBtn = document.createElement('button');
      buyBtn.className = 'card-buy-btn';
      buyBtn.type = 'button';
      buyBtn.textContent = 'Buy Now';

      actionsRow.appendChild(addBtn);
      actionsRow.appendChild(buyBtn);

      card.appendChild(priceDisplay);
      card.appendChild(actionsRow);

      if (sizeBoxes.length > 0) {
        // Multi-size setup: set first active by default
        sizeBoxes[0].classList.add('active');
        const initial = getActiveSizeInfo();
        priceDisplay.textContent = `Rs. ${initial.price}/-`;

        sizeBoxes.forEach((box) => {
          // Add cursor pointer hint
          box.style.cursor = 'pointer';
          box.addEventListener('click', () => {
            sizeBoxes.forEach((b) => b.classList.remove('active'));
            box.classList.add('active');
            const current = getActiveSizeInfo();
            priceDisplay.textContent = `Rs. ${current.price}/-`;
          });
        });
      } else {
        // Single-price setup
        const initial = getActiveSizeInfo();
        priceDisplay.textContent = `Rs. ${initial.price}/-`;
      }

      // Action Handlers
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { size, price } = getActiveSizeInfo();
        addToCart(itemName, size, price);
      });

      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { size, price } = getActiveSizeInfo();
        addToCart(itemName, size, price);
        setDrawerOpen(true);
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      });

      card.setAttribute('data-cart-enhanced', '1');
    });
  }, [menuVersion]);

  useEffect(() => {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.toggle('open', drawerOpen);
    backdrop.classList.toggle('open', drawerOpen);
    document.body.classList.toggle('ck-no-scroll', drawerOpen);
  }, [drawerOpen]);

  useEffect(() => {
    const openBtn = document.getElementById('open-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');
    const backdrop = document.getElementById('cart-backdrop');
    const placeBtn = document.getElementById('place-order-btn');

    const open = () => setDrawerOpen(true);
    const close = () => setDrawerOpen(false);

    const requireAuthForCheckout = () => {
      if (isAuthenticated && user?.email) {
        return true;
      }

      setStatus({ message: `${CHECKOUT_AUTH_MESSAGE} Redirecting…`, error: true });
      saveCheckoutReturnPath('/shop?checkout=1');
      setTimeout(() => navigate('/login?from=checkout'), 700);
      return false;
    };

    const place = async () => {
      if (!cart.length) {
        setStatus({ message: 'Cart is empty. Add items first.', error: true });
        return;
      }

      if (!requireAuthForCheckout()) {
        return;
      }

      const name = document.getElementById('customer-name')?.value || '';
      const phone = document.getElementById('customer-phone')?.value || '';
      const address = document.getElementById('customer-address')?.value || '';
      const paymentMethod = document.getElementById('payment-method')?.value || 'Cash on Delivery';
      const notes = document.getElementById('order-notes')?.value || '';

      if (!name.trim() || !phone.trim() || !address.trim()) {
        setStatus({ message: 'Please fill name, phone, and address.', error: true });
        return;
      }

      setPlacing(true);
      try {
        const total = cart.reduce((acc, item) => acc + item.qty * item.price, 0);

        // Normalize payment method to what backend validator expects: COD or Online
        const mappedPaymentMethod = paymentMethod === 'Online Payment' ? 'Online' : 'COD';

        // Map cart items to backend format (ensuring size is S, M, L, XL)
        const mappedItems = cart.map(item => {
          let normalizedSize = 'M';
          if (item.size === 'S' || item.size === 'Single') normalizedSize = 'S';
          else if (item.size === 'M' || item.size === 'Regular') normalizedSize = 'M';
          else if (item.size === 'L' || item.size === 'Large') normalizedSize = 'L';
          else if (item.size === 'XL') normalizedSize = 'XL';

          return {
            product: item.product || undefined,
            name: item.name,
            size: normalizedSize,
            quantity: item.qty,
            price: item.price
          };
        });

        // Ensure 11-digit phone number mapping for backend validator
        let normalizedPhone = phone.replace(/[^0-9]/g, '');
        if (normalizedPhone.length > 11) normalizedPhone = normalizedPhone.slice(-11);
        else if (normalizedPhone.length < 11) normalizedPhone = normalizedPhone.padStart(11, '0');

        const savedOrder = await createOrder({
          orderItems: mappedItems,
          shippingAddress: address.trim(),
          phoneNumber: normalizedPhone,
          paymentMethod: mappedPaymentMethod,
          notes: notes.trim()
        });
        const orderId = savedOrder?._id || savedOrder?.data?._id || savedOrder?.order_id || '';
        clearCart();
        localStorage.removeItem('cheezka_checkout_form');
        updateCart([]);
        setDrawerOpen(false);
        navigate(orderId ? `/order-confirmation?orderId=${encodeURIComponent(orderId)}` : '/order-confirmation');
        return;
      } catch (err) {
        setStatus({ message: `Order failed: ${err.message}`, error: true });
      } finally {
        setPlacing(false);
      }
    };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    placeBtn?.addEventListener('click', place);

    return () => {
      openBtn?.removeEventListener('click', open);
      closeBtn?.removeEventListener('click', close);
      backdrop?.removeEventListener('click', close);
      placeBtn?.removeEventListener('click', place);
    };
  }, [cart, navigate, user, placing, isAuthenticated]);

  useEffect(() => {
    const statusEl = document.getElementById('order-status');
    const placeBtn = document.getElementById('place-order-btn');
    if (statusEl && status.message) {
      statusEl.textContent = status.message;
      statusEl.classList.toggle('ck-status--error', status.error);
      statusEl.classList.toggle('ck-status--ok', !status.error);
    }
    if (placeBtn) {
      if (placing) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing…';
      } else if (!cart.length) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Place Online Order';
      } else {
        placeBtn.disabled = false;
        placeBtn.textContent = isAuthenticated && user?.email
          ? 'Place Online Order'
          : 'Place Order';
      }
    }
  }, [status, user, placing, isAuthenticated, cart.length]);

  useEffect(() => {
    const fields = ['customer-name', 'customer-phone', 'customer-address', 'payment-method', 'order-notes'];
    const saved = getLocalJson('cheezka_checkout_form', {});
    fields.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      if (saved) {
        const key = id.replace('customer-', '').replace('order-', '');
        if (saved[key]) input.value = saved[key];
      }
      const save = () => {
        setLocalJson('cheezka_checkout_form', {
          name: document.getElementById('customer-name')?.value || '',
          phone: document.getElementById('customer-phone')?.value || '',
          address: document.getElementById('customer-address')?.value || '',
          paymentMethod: document.getElementById('payment-method')?.value || 'Cash on Delivery',
          notes: document.getElementById('order-notes')?.value || '',
        });
      };
      const keydown = (e) => {
        if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') e.preventDefault();
      };
      input.addEventListener('change', save);
      input.addEventListener('input', save);
      input.addEventListener('keydown', keydown);
    });
  }, []);
}
