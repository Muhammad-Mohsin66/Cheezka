// Points to the real Node.js backend
const API_ROOT = 'http://localhost:5001';
const API_BASE = `${API_ROOT}/api`;

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
