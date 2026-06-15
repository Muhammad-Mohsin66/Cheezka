import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { checkHealth, createOrder, listOrders, updateOrderStatus, getCategories, getProducts, getDeals, getBankAccounts } from '../utils/api';
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

export const getImageUrl = (prod) => {
  if (prod.image) return prod.image;
  const mapping = {
    'Zinger Burger': 'zinger_burger.png',
    'Zinger Cheeze Burger': 'zinger_cheese_burger.png',
    'Patty Burger': 'patty_burger.png',
    'Patty Cheeze Burger': 'patty_burger.png',
    'Zinger Shawarma': 'chicken_shawarma.png',
    'Chicken Shawarma': 'chicken_shawarma.png',
    'Zinger Cheeze Shawarma': 'chicken_shawarma.png',
    'B.B.Q Chicken Pizza': 'bbq_pizza.png',
    'Cheese Lover Pizza': 'cheese_pizza.png',
    'Creamy Pasta': 'creamy_pasta.png',
    'Crunchy Pasta': 'crunchy_pasta.png',
    'French Fries': 'loaded_fries.png',
    'Loaded Fries': 'loaded_fries.png',
    'Cheezka Special': 'special_pizza.png',
    'Vegetable Pizza': 'vegetable_pizza.png',
    'Hut Spicy Pizza': 'spicy_pizza.png',
    'Chicken Achari Pizza': 'tikka_pizza.png',
    'Chicken Tikka Pizza': 'tikka_pizza.png',
    'Chicken Fajeta Pizza': 'fajita_pizza.png',
    'Chicken Supreme Pizza': 'special_pizza.png',
    'Crown Crust': 'stuffed_crust.png',
    'Kabab Crust': 'kabab_pizza.png',
    'Cheeze Crust': 'stuffed_crust.png',
    'Chicken Crust': 'stuffed_crust.png',
    'Square King Lazania Pizza': 'cheese_pizza.png',
    'Behari Kabab Pizza': 'kabab_pizza.png',
    'Malai Boti Pizza': 'cheese_pizza.png',
    'Zinger Paratha Roll': 'paratha_roll.png',
    'Zinger Paratha Cheeze': 'paratha_roll.png',
    'Chicken Paratha': 'paratha_roll.png',
  };
  if (mapping[prod.name]) return `/images/menu/${mapping[prod.name]}`;

  let fallback = prod.name.toLowerCase();
  if (fallback.includes('pizza')) return '/images/menu/cheese_pizza.png';
  if (fallback.includes('burger')) return '/images/menu/patty_burger.png';
  if (fallback.includes('pasta')) return '/images/menu/creamy_pasta.png';
  if (fallback.includes('fries')) return '/images/menu/loaded_fries.png';
  if (fallback.includes('shawarma') || fallback.includes('roll')) return '/images/menu/chicken_shawarma.png';
  return '/images/menu/patty_burger.png';
};

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
        payment_status: order.paymentStatus || '',
        notes: order.notes || '',
        items: (order.orderItems || order.items || []).map(item => ({
          name: item.name,
          size: item.size,
          qty: item.quantity || item.qty,
          price: item.price
        })),
        total: order.grandTotal || order.total || order.totalAmount || 0,
        refund: order.refund || null
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
export function useShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCartState] = useState(() => getCart());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });
  const [placing, setPlacing] = useState(false);
  const [menuVersion, setMenuVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    getBankAccounts()
      .then(res => {
        if (res.success && res.data) {
          setBankAccounts(res.data);
        }
      })
      .catch(err => console.error("Failed to fetch bank accounts:", err));
  }, []);

  useEffect(() => {
    const container = document.getElementById('cart-bank-accounts');
    if (!container) return;

    if (bankAccounts.length === 0) {
      container.innerHTML = '<div style="font-size: 11px; color: #dc2626;">No bank accounts configured.</div>';
      return;
    }

    const esc = (text) =>
      String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    container.innerHTML = bankAccounts.map(bank => {
      return `
        <div style="background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; font-size: 11px; color: #334155;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${esc(bank.bankName)}</div>
          <div style="display: grid; grid-template-columns: 50px 1fr; gap: 2px;">
            <span style="color: #64748b;">Title:</span> <span style="font-weight: 600;">${esc(bank.accountTitle)}</span>
            <span style="color: #64748b;">Acc:</span> <span style="font-weight: 600; font-family: monospace;">${esc(bank.accountNumber)}</span>
            ${bank.iban ? `<span style="color: #64748b;">IBAN:</span> <span style="font-weight: 600; font-family: monospace;">${esc(bank.iban)}</span>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }, [bankAccounts, drawerOpen]);

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
    let active = true;
    function getCategoryIcon(name) {
      const n = name.toLowerCase();
      if (n.includes('pizza')) return 'fas fa-fire';
      if (n.includes('burger')) return 'fas fa-hamburger';
      if (n.includes('shawarma') || n.includes('wrap')) return 'fas fa-utensils';
      if (n.includes('pasta') || n.includes('fries')) return 'fas fa-leaf';
      return 'fas fa-utensils';
    }

    async function loadAndRender() {
      try {
        const [catRes, prodRes] = await Promise.all([getCategories(), getProducts()]);
        if (!active) return;
        const categories = catRes.data || catRes || [];
        const products = prodRes.data || prodRes || [];

        const container = document.getElementById('dynamic-menu-container');
        if (!container) return;

        const activeCats = categories.filter(c => c.isActive);
        const activeProds = products.filter(p => p.isActive);

        if (activeProds.length === 0) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100">
              <div style="font-size: 3rem; margin-bottom: 15px;">🍽️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Our Kitchen is Preparing!</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">We are currently updating our menu items. Please check back in a few minutes to see our fresh, hot choices!</p>
            </div>
          `;
          setLoading(false);
          return;
        }


        const grouped = {};
        activeCats.forEach(cat => {
          grouped[cat._id] = {
            name: cat.name,
            description: cat.description,
            products: []
          };
        });

        activeProds.forEach(prod => {
          const catId = prod.category?._id || prod.category;
          if (grouped[catId]) {
            grouped[catId].products.push(prod);
          }
        });

        let html = '';
        let sectionIndex = 0;
        activeCats.forEach((cat) => {
          const catGroup = grouped[cat._id];
          if (!catGroup || catGroup.products.length === 0) return;

          const iconClass = getCategoryIcon(cat.name);

          if (sectionIndex > 0) {
            html += `<hr class="section-divider">`;
          }
          sectionIndex++;

          html += `
            <div class="menu-section">
              <div class="section-header">
                <h2><i class="${iconClass} ck-icon-accent ck-fs-15r ck-mr-8"></i> ${cat.name}</h2>
              </div>
              <div class="row">
                ${catGroup.products.map(prod => {
            const hasSizes = prod.sizes && prod.sizes.length > 0;
            const sizeBoxes = hasSizes
              ? prod.sizes.map((s, idx) => `
                        <div class="size-box ${idx === 0 ? 'active' : ''}">
                          <span class="size-label">${s.size}</span>
                          <span class="size-price">${s.price}/-</span>
                        </div>
                      `).join('')
              : '';

            return `
                    <div class="col-lg-3 col-md-4 col-sm-6 col-12 mb-4">
                      <div class="menu-card" data-product-id="${prod._id}">
                        <div class="menu-card-img-wrap">
                          <img src="${getImageUrl(prod)}" alt="${prod.name}" class="menu-card-img" />
                          ${prod.stockQuantity <= 0 ? '<span class="menu-badge" style="background:#dc2626;color:white;">Out of Stock</span>' : ''}
                        </div>
                        <p class="menu-item-name">${prod.name}</p>
                        ${hasSizes
                ? `<div class="size-grid">${sizeBoxes}</div>`
                : `
                            <div class="single-price-wrap">
                              <span class="price-amount">Rs. ${prod.basePrice}/-</span>
                            </div>
                          `}
                      </div>
                    </div>
                  `;
          }).join('')}
              </div>
            </div>
          `;
        });

        container.innerHTML = html;
        setLoading(false);
        setMenuVersion(v => v + 1);
      } catch (err) {
        console.error('Error rendering shop page:', err);
        const container = document.getElementById('dynamic-menu-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100">
              <div style="font-size: 3rem; margin-bottom: 15px; color:#dc2626;">⚠️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Error Loading Menu</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">Could not load products. Please check your internet connection or reload the page.</p>
            </div>
          `;
        }
        setLoading(false);
      }
    }

    loadAndRender();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;

    const parsePrice = (raw) => {
      const cleaned = String(raw || '').replace(/[^0-9]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 0;
    };

    const addToCart = (productId, name, size, price) => {
      updateCart((prev) => {
        const found = prev.find((item) => item.name === name && item.size === size && item.price === price);
        if (found) {
          return prev.map((item) => (item === found ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { product: productId, name, size, price, qty: 1 }];
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
        const productId = card.getAttribute('data-product-id');
        addToCart(productId, itemName, size, price);
      });

      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { size, price } = getActiveSizeInfo();
        const productId = card.getAttribute('data-product-id');
        addToCart(productId, itemName, size, price);
        setDrawerOpen(true);
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      });

      card.setAttribute('data-cart-enhanced', '1');
    });
  }, [menuVersion, loading]);

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

      let transactionId = '';
      let screenshotFile = null;
      if (paymentMethod === 'Online Payment') {
        transactionId = document.getElementById('transaction-id')?.value || '';
        const fileInput = document.getElementById('payment-screenshot');
        screenshotFile = fileInput?.files?.[0] || null;

        if (!transactionId.trim() || !screenshotFile) {
          setStatus({ message: 'Transaction ID and Screenshot are required for Online Payment.', error: true });
          return;
        }
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

        if (mappedPaymentMethod === 'Online' && screenshotFile) {
          setStatus({ message: 'Order created. Uploading receipt...', error: false });
          const formData = new FormData();
          formData.append('order', orderId);
          formData.append('transactionId', transactionId.trim());
          formData.append('screenshot', screenshotFile);
          formData.append('amount', savedOrder?.data?.grandTotal || total);
          formData.append('paymentMethod', mappedPaymentMethod);

          const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          const uploadHeaders = {};
          const token = localStorage.getItem('authToken');
          if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

          const uploadRes = await fetch(`${API_BASE}/payments/upload/${orderId}`, {
            method: 'POST',
            headers: uploadHeaders,
            body: formData
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(`Order placed, but receipt upload failed: ${errData.message || errData.detail || 'Unknown error'}`);
          }
        }

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

      const handleChange = (e) => {
        save();
        if (id === 'payment-method') {
          const detailsDiv = document.getElementById('online-payment-details');
          if (detailsDiv) {
            detailsDiv.style.display = input.value === 'Online Payment' ? 'block' : 'none';
          }
        }
      };

      input.addEventListener('change', handleChange);
      input.addEventListener('input', save);
      input.addEventListener('keydown', keydown);
    });

    const payMethodInput = document.getElementById('payment-method');
    const detailsDiv = document.getElementById('online-payment-details');
    if (payMethodInput && detailsDiv) {
      detailsDiv.style.display = payMethodInput.value === 'Online Payment' ? 'block' : 'none';
    }
  }, [drawerOpen]);
}

// ─────────────────────────────────────────────
// Pages page (Special Deals)
// ─────────────────────────────────────────────
export function usePagesPage() {
  const [loading, setLoading] = useState(true);
  const [dealsVersion, setDealsVersion] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadDeals() {
      try {
        const res = await getDeals();
        if (!active) return;
        const deals = res.data || res || [];
        const container = document.getElementById('dynamic-deals-container');
        if (!container) return;

        const activeDeals = deals.filter(d => d.isActive);

        if (activeDeals.length === 0) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px;">🎁</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">No Active Deals</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">We don't have any special deals running right now. Keep checking back or view our full menu!</p>
            </div>
          `;
          setLoading(false);
          return;
        }

        let html = '';
        activeDeals.forEach((deal, idx) => {
          const discountText = deal.discount ? `${deal.discount}% OFF` : `Deal ${idx + 1}`;
          let itemsList = '';
          if (deal.products && deal.products.length > 0) {
            itemsList = deal.products.map(p => `<li>${p.name || p.title || p}</li>`).join('');
          } else if (deal.description) {
            const parts = deal.description.split('+');
            itemsList = parts.map(part => `<li>${part.trim()}</li>`).join('');
          }

          html += `
            <div class="col-lg-4 col-md-6 col-12 mb-4">
              <div class="deal-card">
                <div class="deal-top"><h3>${deal.title}</h3><span class="deal-tag">${discountText}</span></div>
                <div class="deal-body">
                  ${deal.products && deal.products.length > 0 && deal.description ? `<p class="deal-desc" style="color:#777; margin-bottom:12px; font-size:0.95rem;">${deal.description}</p>` : ''}
                  ${itemsList ? `<ul class="deal-items" style="list-style:disc; padding-left:20px; margin-bottom:15px;">${itemsList}</ul>` : ''}
                  <div class="deal-price">Rs. ${deal.dealPrice}/-</div>
                  <a href="contact.html" class="deal-btn">Order This Deal</a>
                </div>
              </div>
            </div>
          `;
        });

        container.innerHTML = html;
        setLoading(false);
        setDealsVersion(v => v + 1);
      } catch (err) {
        console.error('Error rendering deals page:', err);
        const container = document.getElementById('dynamic-deals-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px; color:#dc2626;">⚠️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Error Loading Deals</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">Could not load active deals. Please try reloading the page.</p>
            </div>
          `;
        }
        setLoading(false);
      }
    }

    loadDeals();
    return () => { active = false; };
  }, []);
}

// ─────────────────────────────────────────────
// Home page (Featured Products)
// ─────────────────────────────────────────────
export function useHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [homeVersion, setHomeVersion] = useState(0);
  const [productsList, setProductsList] = useState([]);
  const [cart, setCartState] = useState(() => getCart());

  const updateCart = (updater) => {
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistCart(next);
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    async function loadHomeProducts() {
      try {
        const prodRes = await getProducts();
        if (!active) return;
        const products = prodRes.data || prodRes || [];
        setProductsList(products);

        const container = document.getElementById('dynamic-home-products');
        if (!container) return;

        const activeProds = products.filter(p => p.isActive).slice(0, 6);

        if (activeProds.length === 0) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px;">🍽️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Our Kitchen is Preparing!</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">We are currently updating our menu items. Please check back in a few minutes to see our fresh, hot choices!</p>
            </div>
          `;
          setLoading(false);
          return;
        }

        let html = '';
        activeProds.forEach(prod => {
          const hasSizes = prod.sizes && prod.sizes.length > 0;
          let priceText = '';
          if (hasSizes) {
            const prices = prod.sizes.map(s => s.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceText = minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
          } else {
            priceText = `${prod.basePrice}`;
          }

          html += `
            <div class="col-lg-4 col-md-4 col-sm-6 productsubtitlenone product text-center mb-4">   
              <a href="/shop" class="woocommerce-LoopProduct-link woocommerce-loop-product__link"> 
                <div class="wrappimage" style="height: 250px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fcf8f5; border-radius: 8px;">
                  <img decoding="async" width="500" height="500" src="${getImageUrl(prod)}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="${prod.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
                </div>
                <div class="star-rating" role="img" aria-label="Rated 5.00 out of 5"><span class="ck-w-100">Rated <strong class="rating">5.00</strong> out of 5</span></div>
                <h2 class="woocommerce-loop-product__title" style="font-family:'Nunito Sans',sans-serif; font-weight: 800; color:#1b2a49;">${prod.name}</h2>
                <span class="productsubtitle" style="font-size:0.9rem; color:#777; min-height:40px; display:block;">${prod.description || ''}</span>
                <span class="price">
                  <span class="woocommerce-Price-amount amount">
                    <bdi><span class="woocommerce-Price-currencySymbol">Rs. </span>${priceText}</bdi>
                  </span>
                </span>
              </a>
              <button class="button product_type_simple add_to_cart_button ajax_add_to_cart homepage-add-to-cart" 
                      data-product-id="${prod._id}" 
                      data-product-name="${prod.name}"
                      style="border:none; cursor:pointer;"
                      role="button">Add to cart</button>
            </div>
          `;
        });

        container.innerHTML = html;
        setLoading(false);
        setHomeVersion(v => v + 1);
      } catch (err) {
        console.error('Error rendering homepage products:', err);
        const container = document.getElementById('dynamic-home-products');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px; color:#dc2626;">⚠️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Error Loading Products</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">Could not load popular products. Please check your internet connection.</p>
            </div>
          `;
        }
        setLoading(false);
      }
    }

    loadHomeProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;

    const addToCart = (productId, name, size, price) => {
      updateCart((prev) => {
        const found = prev.find((item) => item.name === name && item.size === size && item.price === price);
        if (found) {
          return prev.map((item) => (item === found ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { product: productId, name, size, price, qty: 1 }];
      });
      navigate('/shop?cart=1');
    };

    const buttons = document.querySelectorAll('.homepage-add-to-cart');
    const handlers = [];

    buttons.forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');

        const prod = productsList.find(p => p._id === productId);
        if (!prod) return;

        let size = 'Regular';
        let price = prod.basePrice || 0;

        if (prod.sizes && prod.sizes.length > 0) {
          size = prod.sizes[0].size;
          price = prod.sizes[0].price;
        }

        addToCart(productId, name, size, price);
      };

      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [homeVersion, loading, productsList, navigate]);
}

