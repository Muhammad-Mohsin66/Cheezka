import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkHealth, createOrder, listOrders, updateOrderStatus } from './utils/api';

const API_BASE = 'http://localhost:5001/api';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

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

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('cheezka_user', JSON.stringify({ ...data.user, rememberMe }));
      localStorage.removeItem('cheezka_login_form');

      setStatus({ message: 'Login successful! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return { email, setEmail, password, setPassword, rememberMe, setRememberMe, status, onSubmit };
}

// ─────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────
export function useSignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

  useEffect(() => {
    if (localStorage.getItem('cheezka_user')) {
      setStatus({ message: 'Already logged in. Redirecting…', bg: '#fff3e0', color: '#e65100' });
      const t = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [navigate]);

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
    if (password.length < 6) {
      setStatus({ message: 'Password must be at least 6 characters', bg: '#ffcdd2', color: '#c62828' });
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
    if (!phoneVal || !/^\d{10}$/.test(phoneVal)) {
      setStatus({ message: 'Please enter a valid 10-digit phone number', bg: '#ffcdd2', color: '#c62828' });
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

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('cheezka_user', JSON.stringify(data.user));

      setStatus({ message: 'Account created! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    termsAgreed, setTermsAgreed,
    status, onSubmit,
  };
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export function useDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [apiStatus, setApiStatus] = useState({ message: '', error: false, visible: false });

  useEffect(() => {
    const userData = getLocalJson('cheezka_user', null);
    if (!userData) {
      const t = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(t);
    }
    setUser(userData);

    (async () => {
      try {
        await checkHealth();
        setApiStatus({ message: 'Connected to backend API.', error: false, visible: true });
      } catch {
        setApiStatus({
          message: 'Could not connect to backend. Make sure the server is running on http://localhost:5001',
          error: true,
          visible: true,
        });
      }
    })();
    return undefined;
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('cheezka_user');
    localStorage.removeItem('authToken');
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
      setOrders(Array.isArray(list) ? list : []);
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
  const [cart, setCart] = useState(() => getLocalJson('cheezka_cart', []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });
  const [placing, setPlacing] = useState(false);

  const user = getLocalJson('cheezka_user', null);

  useEffect(() => {
    setLocalJson('cheezka_cart', cart);
  }, [cart]);

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
        setCart((prev) => {
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
      setCart((prev) => {
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
      card.querySelectorAll('.size-box').forEach((box) => {
        const size = box.querySelector('.size-label')?.textContent?.trim() || 'Single';
        const price = parsePrice(box.querySelector('.size-price')?.textContent);
        const addBtn = document.createElement('button');
        addBtn.className = 'menu-add-btn';
        addBtn.type = 'button';
        addBtn.textContent = `Add ${size} (Rs. ${price})`;
        addBtn.addEventListener('click', () => addToCart(itemName, size, price));
        const buyBtn = document.createElement('button');
        buyBtn.className = 'menu-buy-btn';
        buyBtn.type = 'button';
        buyBtn.textContent = 'Buy Now';
        buyBtn.addEventListener('click', () => {
          addToCart(itemName, size, price);
          setDrawerOpen(true);
          setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
        });
        box.appendChild(addBtn);
        box.appendChild(buyBtn);
      });
      card.setAttribute('data-cart-enhanced', '1');
    });

    document.querySelectorAll('.item-row').forEach((row) => {
      if (row.getAttribute('data-cart-enhanced') === '1') return;
      const name = row.querySelector('.item-row-name')?.textContent?.trim();
      const price = parsePrice(row.querySelector('.item-row-price')?.textContent);
      if (!name) return;
      const btn = document.createElement('button');
      btn.className = 'list-add-btn';
      btn.type = 'button';
      btn.textContent = 'Add';
      btn.addEventListener('click', () => addToCart(name, 'Regular', price));
      const buyBtn = document.createElement('button');
      buyBtn.className = 'list-buy-btn';
      buyBtn.type = 'button';
      buyBtn.textContent = 'Buy Now';
      buyBtn.addEventListener('click', () => {
        addToCart(name, 'Regular', price);
        setDrawerOpen(true);
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      });
      row.appendChild(btn);
      row.appendChild(buyBtn);
      row.setAttribute('data-cart-enhanced', '1');
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

    const place = async () => {
      if (!user?.email) {
        setStatus({ message: 'Please login first to place an order. Redirecting…', error: true });
        setTimeout(() => navigate('/login'), 900);
        return;
      }

      const name = document.getElementById('customer-name')?.value || '';
      const phone = document.getElementById('customer-phone')?.value || '';
      const address = document.getElementById('customer-address')?.value || '';
      const paymentMethod = document.getElementById('payment-method')?.value || 'Cash on Delivery';
      const notes = document.getElementById('order-notes')?.value || '';

      if (!cart.length) {
        setStatus({ message: 'Cart is empty. Add items first.', error: true });
        return;
      }
      if (!name.trim() || !phone.trim() || !address.trim()) {
        setStatus({ message: 'Please fill name, phone, and address.', error: true });
        return;
      }

      setPlacing(true);
      try {
        const total = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
        const savedOrder = await createOrder({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_address: address.trim(),
          payment_method: paymentMethod,
          notes: notes.trim(),
          items: cart,
          total,
        });
        localStorage.removeItem('cheezka_cart');
        localStorage.removeItem('cheezka_checkout_form');
        setCart([]);
        setStatus({ message: `Order placed successfully. Order ID: ${savedOrder._id || savedOrder.order_id}`, error: false });
        ['customer-name', 'customer-phone', 'customer-address', 'order-notes'].forEach((id) => {
          const input = document.getElementById(id);
          if (input) input.value = '';
        });
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
  }, [cart, navigate, user, placing]);

  useEffect(() => {
    const statusEl = document.getElementById('order-status');
    const placeBtn = document.getElementById('place-order-btn');
    if (statusEl && status.message) {
      statusEl.textContent = status.message;
      statusEl.classList.toggle('ck-status--error', status.error);
      statusEl.classList.toggle('ck-status--ok', !status.error);
    }
    if (placeBtn) {
      if (!user?.email) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Login Required';
      } else if (placing) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing…';
      } else {
        placeBtn.disabled = false;
        placeBtn.textContent = 'Place Online Order';
      }
    }
  }, [status, user, placing]);

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
