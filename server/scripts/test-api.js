async function run() {
  const port = 5001;
  const API_BASE = `http://localhost:${port}/api`;

  try {
    console.log('Logging in as customer hassanramzan59@gmail.com...');
    let res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hassanramzan59@gmail.com', password: 'customer123' })
    });
    let data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const customerToken = data.token;
    console.log('Customer logged in! Token:', customerToken.slice(0, 15) + '...');

    console.log('\nFetching customer orders details...');
    res = await fetch(`${API_BASE}/orders/my-orders/list`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    data = await res.json();
    const orders = data.data || [];
    console.log(`Found ${orders.length} orders:`);
    orders.forEach(o => {
      console.log(`Order ID: ${o._id}, Status: ${o.orderStatus}`);
    });

    console.log('\nLogging in as admin...');
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cheezka.com', password: 'admin123' })
    });
    data = await res.json();
    const adminToken = data.token;

    const orderToUpdate = orders[0];
    if (!orderToUpdate) {
      console.log('No order found for hassan to update.');
      return;
    }

    console.log(`\nAdmin changing status of order ${orderToUpdate._id} to "Confirmed"...`);
    res = await fetch(`${API_BASE}/orders/${orderToUpdate._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ orderStatus: 'Confirmed' })
    });
    data = await res.json();
    console.log('Admin status change response:', data);

    console.log('\nFetching customer order list again...');
    res = await fetch(`${API_BASE}/orders/my-orders/list`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    data = await res.json();
    console.log('Customer orders response count:', data.data?.length);
    console.log('Orders after status change:', data.data?.map(o => ({ id: o._id, status: o.orderStatus })));

  } catch (err) {
    console.error('Error in API test:', err);
  }
}

run();
