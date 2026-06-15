const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || `HTTP error! status: ${response.status}`);
  }
  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export const endpoints = {
  API_ROOT,
  API_BASE,
  HEALTH: `${API_BASE}/health`,
  ORDERS_CREATE: `${API_BASE}/orders`,
  ORDERS_LIST: `${API_BASE}/orders/my-orders/list`,
  orderStatus: (orderId) => `${API_BASE}/orders/${encodeURIComponent(orderId)}/status`,
};

export async function checkHealth() {
  const response = await fetch(endpoints.HEALTH);
  return parseJson(response);
}

export async function listOrders() {
  const response = await fetch(endpoints.ORDERS_LIST, {
    headers: getAuthHeaders(),
  });
  return parseJson(response);
}

export async function updateOrderStatus(orderId, status) {
  const response = await fetch(endpoints.orderStatus(orderId), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderStatus: status }),
  });
  return parseJson(response);
}

export async function createOrder(payload) {
  const response = await fetch(endpoints.ORDERS_CREATE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function getOrderDetails(orderId) {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/details`, {
    headers: getAuthHeaders(),
  });
  return parseJson(response);
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getProducts() {
  const response = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getDeals() {
  const response = await fetch(`${API_BASE}/deals`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getBankAccounts() {
  const response = await fetch(`${API_BASE}/bank-accounts`, { cache: 'no-store' });
  return parseJson(response);
}

export async function requestRefund(orderId, reason) {
  const response = await fetch(`${API_BASE}/refunds/request`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId, reason }),
  });
  return parseJson(response);
}

export async function getMyRefunds() {
  const response = await fetch(`${API_BASE}/refunds/my-refunds`, {
    headers: getAuthHeaders(),
  });
  return parseJson(response);
}
