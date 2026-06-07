import AuthLayout from '../layouts/AuthLayout';
import { useLoginPage } from '../hooks/pageHooks';

export default function LoginPage() {
  const {
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
  } = useLoginPage();

  return (
    <AuthLayout>
      <main>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <img src="assets/images/2020/12/Logo_light1.svg" alt="cheezka" className="auth-logo" />
              <h1>Welcome Back!</h1>
              <p>Login to your Cheezka account</p>
            </div>
            {checkoutNotice ? (
              <div
                id="checkout-auth-notice"
                style={{ display: 'block', backgroundColor: '#fff3e0', color: '#e65100', marginBottom: '16px', padding: '12px', borderRadius: '6px' }}
              >
                {checkoutNotice}
              </div>
            ) : null}
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
              Don't have an account? <a href={fromCheckout ? '/signup?from=checkout' : '/signup'}>Sign up here</a>
            </div>
            <div className="home-link">
              <a href="/"><i className="fa fa-chevron-left ck-mr-5" /> Back to Home</a>
            </div>
          </div>
        </div>
      </main>
    </AuthLayout>
  );
}
