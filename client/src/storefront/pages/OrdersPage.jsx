import { useOrdersPage } from '../../pageHooks';

/**
 * OrdersPage — Customer-facing orders view.
 * READ-ONLY: Customers can view their order history and status,
 * but cannot modify order statuses.
 * Order status management is exclusively available in the Admin Panel.
 */
export default function OrdersPage() {
  const { status, orders, lastUpdated, refresh } = useOrdersPage();

  return (
    <div className="page-root">
      <div className="top-fixed">
        <div className="container navp0">
          <div className="row overflows smallscreen-wrapper align-items-center">
            <div className="col pt-1 pb-1">
              <nav className="navbar pl-0 pr-0 navbar-expand-lg minicartfix">
                <a className="navbar-brand" href="/" title="cheezka" rel="home">
                  <img src="assets/images/2020/12/Logo_light.svg" alt="cheezka" />
                </a>
                <button className="navbar-toggler first-button pt-1" type="button" data-toggle="collapse" data-target="#main_nav" aria-controls="main_nav" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="animated-icon1"><span /><span /><span /></span>
                </button>
                <div className="justify-content-end custom-mega-menu custom-mega-menub collapse navbar-collapse" id="main_nav">
                  <ul id="menu-menu-1" className="navbar-nav">
                    <li className="menu-item"><a href="/">HOME</a></li>
                    <li className="menu-item"><a href="/shop">SHOP</a></li>
                    <li className="menu-item"><a href="/about">ABOUT</a></li>
                    <li className="menu-item"><a href="/pages">PAGES</a></li>
                    <li className="menu-item"><a href="/contact">CONTACT</a></li>
                    <li className="menu-item"><a href="/orders" className="ck-nav-active">ORDERS</a></li>
                    <li className="menu-item ck-ml-8"><a href="/contact" className="ck-nav-cta"><i className="fa fa-envelope ck-mr-6" />CONTACT US</a></li>
                    <li className="menu-item ck-ml-8"><a href="/login" className="ck-nav-cta"><i className="fa fa-sign-in-alt ck-mr-6" />LOGIN</a></li>
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <main>
        <div className="page-banner">
          <div className="container">
            <h1>My Orders</h1>
            <p>Track your online orders in real time</p>
          </div>
        </div>
        <div className="container ck-pb-60">
          <div id="status-box" className={`status-box ${status.visible ? '' : 'ck-hidden'} ${status.error ? 'err' : 'ok'}`}>{status.message}</div>
          <div className="refresh-meta">
            <span id="last-updated">Last updated: {lastUpdated}</span>
            <button id="refresh-orders-btn" className="status-save-btn ck-pad-7-12" onClick={refresh}>Refresh</button>
          </div>
          <div id="orders-list">
            {orders === null ? (
              <div className="empty-box">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="empty-box">No online orders found.</div>
            ) : (
              orders.map((order) => (
                <div className="order-card" key={order.order_id}>
                  <div className="order-head">
                    <div>
                      <div className="order-id">{order.order_id}</div>
                      <div className="order-date">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    {/* Status badge — display only, no editing for customers */}
                    <div className="order-status">{order.status}</div>
                  </div>
                  <div className="meta-grid">
                    <div className="meta-box"><div className="meta-title">Customer</div><div className="meta-value">{order.customer_name}</div></div>
                    <div className="meta-box"><div className="meta-title">Phone</div><div className="meta-value">{order.customer_phone}</div></div>
                    <div className="meta-box"><div className="meta-title">Address</div><div className="meta-value">{order.customer_address}</div></div>
                    <div className="meta-box"><div className="meta-title">Payment</div><div className="meta-value">{order.payment_method}</div></div>
                  </div>
                  {order.notes ? <div className="meta-box ck-mb-10"><div className="meta-title">Notes</div><div className="meta-value">{order.notes}</div></div> : null}
                  <div className="items-wrap">
                    {(order.items || []).map((item, idx) => (
                      <div className="item-row" key={`${order.order_id}-${idx}`}>
                        <div>
                          <div className="item-name">{item.name}</div>
                          <div className="item-info">Size: {item.size} | Qty: {item.qty}</div>
                        </div>
                        <div className="item-price">Rs. {(item.qty || 0) * (item.price || 0)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">Total: Rs. {order.total}</div>
                  {/* NOTE: Status editor removed from customer view.
                      Order status changes are admin-only (see /admin/orders). */}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
