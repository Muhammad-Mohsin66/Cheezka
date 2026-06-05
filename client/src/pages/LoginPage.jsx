import { useLoginPage } from '../pageHooks';

export default function LoginPage() {
  const { email, setEmail, password, setPassword, rememberMe, setRememberMe, status, onSubmit } = useLoginPage();

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
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <img src="assets/images/2020/12/Logo_light1.svg" alt="cheezka" className="auth-logo" />
              <h1>Welcome Back!</h1>
              <p>Login to your Cheezka account</p>
            </div>
            <form id="login-form" method="post" action="#" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input type="email" id="login-email" name="email" placeholder="your@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input type="password" id="login-password" name="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="remember-forgot">
                <label className="ck-remember-label">
                  <input type="checkbox" name="remember" id="remember-me" className="ck-mr-5" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me
                </label>
                <a href="#">Forgot password?</a>
              </div>
              <div id="form-status" style={{ display: status.message ? 'block' : 'none', backgroundColor: status.bg, color: status.color }}>
                {status.message}
              </div>
              <button type="submit" className="submit-btn">Login Now</button>
            </form>
            <div className="signup-link">
              Don't have an account? <a href="/signup">Sign up here</a>
            </div>
            <div className="home-link">
              <a href="/"><i className="fa fa-chevron-left ck-mr-5" /> Back to Home</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
