import { useDashboardPage } from '../hooks/pageHooks';

export default function DashboardPage() {
  const { user, displayName, apiStatus, blogs, logout } = useDashboardPage();

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
                    <li className="menu-item"><a href="/orders">ORDERS</a></li>
                    <li className="menu-item ck-ml-8"><a href="/contact" className="ck-nav-cta"><i className="fa fa-envelope ck-mr-6" />CONTACT US</a></li>
                    <li className="menu-item current-menu-item"><a href="/dashboard" className="ck-nav-active"><i className="fa fa-user-circle" /> DASHBOARD</a></li>
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
            <h1>Your Dashboard</h1>
            <p>Manage your account and view blogs</p>
          </div>
        </div>
        <div className="container dashboard-wrapper">
          <div className="row">
            <div className="col-lg-12 col-12">
              <div className={`user-card ${user ? '' : 'ck-hidden'}`} id="user-card">
                <h2 id="user-name">Welcome, {displayName}!</h2>
                <div className="user-email" id="user-email">{user?.email || ''}</div>
                <button className="logout-btn" onClick={logout}>
                  <i className="fa fa-sign-out-alt ck-mr-8" />Logout
                </button>
              </div>

              <div id="api-status" className={`api-status ${apiStatus.visible ? '' : 'ck-hidden'} ${apiStatus.error ? 'error' : 'success'}`}>
                {apiStatus.message ? <><i className={`fa ${apiStatus.error ? 'fa-exclamation-circle' : 'fa-check-circle'}`} /> {apiStatus.message}</> : null}
              </div>

              <h2 className="section-title">Latest Blog Posts</h2>
              <div id="blogs-container">
                {blogs === null ? (
                  <div className="loading"><i className="fa fa-spinner" /> Loading blogs...</div>
                ) : blogs.length === 0 ? (
                  <div className="empty-state">
                    <i className={`fa ${apiStatus.error ? 'fa-server' : 'fa-file-alt'}`} />
                    <h3>{apiStatus.error ? 'Backend Connection Error' : 'No blog posts yet'}</h3>
                    <p>{apiStatus.error ? 'The API server might not be running. Start it with: cd backend && python main.py' : 'Check back later for updates!'}</p>
                  </div>
                ) : (
                  blogs.map((blog) => (
                    <div className="blog-card" key={blog.id || blog.created_at || blog.title}>
                      <h3>{blog.title}</h3>
                      <p>{blog.body?.substring(0, 200)}{blog.body?.length > 200 ? '...' : ''}</p>
                      <div className="blog-meta"><i className="fa fa-calendar" /> {new Date(blog.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="footer-wrapper">
        <div className="footer">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 col-md-12">
                <aside className="footer-widgets-outer-wrapper">
                  <div className="row footer-widgets-wrapper">
                    <div className="footer-widgets col-lg col-md-6 col-12 grid-item">
                      <div className="widget widget_media_image">
                        <div className="widget-content">
                          <img width={63} height={56} src="assets/images/2020/12/Logo_light1.svg" className="image attachment-full size-full ck-img-fluid" alt="" />
                        </div>
                      </div>
                      <div className="widget widget_text">
                        <div className="widget-content">
                          <div className="textwidget">
                            <p>Best street food in town. Burgers, Pizzas, Shawarma &amp; more!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="footer-widgets col-lg col-md-6 col-12 grid-item">
                      <div className="widget_text widget widget_custom_html">
                        <div className="widget_text widget-content">
                          <h2 className="widget-title">Call us</h2>
                          <div className="textwidget custom-html-widget">
                            <h5 className="footercta"><i className="fa fa-phone-alt" /> 0303-2793109</h5>
                            <h5 className="footercta"><i className="fa fa-phone-alt" /> 0303-2444109</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="footer-widgets col-lg col-md-6 col-12 grid-item">
                      <div className="widget_text widget widget_custom_html">
                        <div className="widget_text widget-content">
                          <h2 className="widget-title">Contacts</h2>
                          <div className="textwidget custom-html-widget">
                            <ul className="footerul">
                              <li className="footerul1"><i className="fa fa-location-arrow" /> Address</li>
                              <li className="footerul2 mb-1">Atif Road Ada Shreen Mor Near Meezan Bank</li>
                              <li className="footerul1"><i className="fa fa-clock" /> Working Time</li>
                              <li className="footerul2 footerul3">Monday – Friday: <span>11:00 – 00:00</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="footer-widgets col-lg col-md-6 col-12 grid-item">
                      <div className="widget_text widget widget_custom_html">
                        <div className="widget_text widget-content">
                          <h2 className="widget-title">Quick Links</h2>
                          <div className="textwidget custom-html-widget">
                            <ul className="footerul">
                              <li className="footerul2"><a href="/">Home</a></li>
                              <li className="footerul2"><a href="/shop">Shop / Menu</a></li>
                              <li className="footerul2"><a href="/about">About Us</a></li>
                              <li className="footerul2"><a href="/contact">Contact</a></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
     </div>
  );
}
